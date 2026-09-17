/**
 * codeforces.sync.js
 *
 * Batch Codeforces sync engine for the daily cron job.
 *
 * Design goals
 * ───────────────────────────────────────────────────────────────────────────
 * • Strictly sequential API calls per user — CF enforces ~1 req/2s per IP on
 *   user.status (the most frequent call).  Concurrency is therefore hardcoded
 *   to 1 between users; the CRON_CF_DELAY_MS inter-user gap (default 2100ms)
 *   provides the required spacing.
 * • Each user runs three sequential CF API calls (user.info → user.status →
 *   user.rating) then immediately writes to DB before the next user starts.
 *   This keeps peak memory flat and avoids sending bursts.
 * • Cursor-based DB pagination — never loads all CF users into memory.
 * • Exponential-backoff retry on 429 / 5xx transient failures.  A 429 always
 *   waits at least CRON_CF_DELAY_MS * 4 before the next attempt.
 * • Per-user failure is isolated — one bad user never aborts the batch.
 * • Never overwrites valid existing data when a request temporarily fails.
 * • Reuses fetchUserInfo / fetchUserStatus / fetchUserRating from the existing
 *   codeforces.provider and buildCodeforcesPayload / persistCodeforcesData
 *   from the existing service layer.
 */

import prisma from '../../config/prisma.js';
import { sleep } from '../../utils/sleep.js';
import {
  fetchUserInfo,
  fetchUserStatus,
  fetchUserRating,
} from '../../utils/codeforces.provider.js';
import { buildCodeforcesPayload } from '../../utils/codeforces.mapper.js';
import { persistCodeforcesData } from '../codeforces.service.js';
import { calcCodeforcesScore, calcLucyScore } from '../../utils/scoring.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const BATCH_SIZE  = parseInt(process.env.CRON_BATCH_SIZE          || '100',  10);
const CF_DELAY    = parseInt(process.env.CRON_CF_DELAY_MS         || '2100', 10); // ≥2 s CF limit
const RETRY_COUNT = parseInt(process.env.CRON_RETRY_COUNT         || '3',    10);
const BASE_DELAY  = parseInt(process.env.CRON_RETRY_BASE_DELAY_MS || '5000', 10);

// ─── Single-user sync with retry ─────────────────────────────────────────────

/**
 * Fetch, map, score, and persist Codeforces data for one user.
 * Returns `{ success: true, userId, codeforcesScore, lucyScore }` on success
 * or `{ success: false, userId, error }` after exhausted retries.
 *
 * @param {{ id: string, codeforcesUsername: string }} user
 * @param {object} counters – shared mutable counter object
 */
const syncOneUser = async (user, counters) => {
  const handle = user.codeforcesUsername.trim();
  let attempt = 0;

  while (attempt <= RETRY_COUNT) {
    try {
      // Three sequential CF API calls (required — CF rate limit is per-IP)
      const cfUser        = await fetchUserInfo(handle);
      const submissions   = await fetchUserStatus(handle);
      const ratingChanges = await fetchUserRating(handle);

      // Map raw API response → internal payload
      const payload = buildCodeforcesPayload(cfUser, submissions, ratingChanges);

      // Compute score
      const codeforcesScore = calcCodeforcesScore({
        rating:           payload.rating,
        ratingWiseSolved: payload.ratingWiseSolved,
      });
      payload.codeforcesScore = codeforcesScore;

      // Persist to PostgreSQL (upsert — safe to re-run)
      await persistCodeforcesData(user.id, payload);

      // Recompute lucyScore = current leetcodeScore + new codeforcesScore
      const lcStats = await prisma.leetcodeStats.findUnique({
        where:  { userId: user.id },
        select: { leetcodeScore: true },
      });
      const lcScore   = lcStats?.leetcodeScore ?? 0;
      const lucyScore = calcLucyScore(lcScore, codeforcesScore);

      await prisma.user.update({
        where: { id: user.id },
        data:  { lucyScore },
      });

      return { success: true, userId: user.id, codeforcesScore, lucyScore };
    } catch (err) {
      const isRateLimit   = err.statusCode === 429;
      const isTransient   = isRateLimit || err.statusCode >= 500 || !err.statusCode;
      const isLastAttempt = attempt === RETRY_COUNT;

      if (isRateLimit) {
        counters.rateLimitRetries++;
        // On rate-limit, use a longer initial wait (4× the normal inter-user gap)
        const rateLimitWait = CF_DELAY * 4 * Math.pow(2, attempt);
        console.warn(
          `[CF Sync] User ${user.id} (${handle}) — rate limited on attempt ${attempt + 1}, ` +
          `waiting ${rateLimitWait}ms before retry`
        );
        await sleep(rateLimitWait);
        attempt++;
        continue;
      }

      if (isTransient && !isLastAttempt) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(
          `[CF Sync] User ${user.id} (${handle}) attempt ${attempt + 1} failed ` +
          `(${err.statusCode || 'network'}) — retrying in ${delay}ms`
        );
        await sleep(delay);
        attempt++;
        continue;
      }

      // Non-transient error (e.g. 404 handle-not-found) or retries exhausted
      return { success: false, userId: user.id, error: err.message || String(err) };
    }
  }

  return { success: false, userId: user.id, error: 'Exhausted retries' };
};

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Sync ALL users who have a Codeforces username connected.
 *
 * Users are processed ONE AT A TIME (concurrency = 1) with a mandatory
 * CF_DELAY pause between each user to stay within Codeforces rate limits.
 * Cursor-based DB pagination keeps memory usage flat.
 *
 * @param {object} [opts]
 * @param {number} [opts.batchSize]  – DB page size (default: BATCH_SIZE env)
 * @param {number} [opts.cfDelay]   – inter-user delay ms (default: CF_DELAY env)
 *
 * @returns {Promise<{
 *   total:            number,
 *   success:          number,
 *   failed:           number,
 *   rateLimitRetries: number,
 *   errors:           Array<{ userId: string, error: string }>,
 * }>}
 */
export const runCodeforcesSync = async ({
  batchSize = BATCH_SIZE,
  cfDelay   = CF_DELAY,
} = {}) => {
  const counters = {
    total:            0,
    success:          0,
    failed:           0,
    rateLimitRetries: 0,
    errors:           [],
  };

  let cursor  = undefined;
  let hasMore = true;
  let isFirst = true; // skip the pre-user delay for the very first user

  console.log(`[CF Sync] Starting — batchSize=${batchSize}, cfDelay=${cfDelay}ms, retryCount=${RETRY_COUNT}`);

  while (hasMore) {
    // ── Fetch one page of CF-connected users ─────────────────────────────────
    const users = await prisma.user.findMany({
      where: {
        codeforcesUsername: { not: null },
        NOT: { codeforcesUsername: '' },
      },
      select:  { id: true, codeforcesUsername: true },
      take:    batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (users.length === 0) { hasMore = false; break; }

    cursor  = users[users.length - 1].id;
    hasMore = users.length === batchSize;

    counters.total += users.length;
    console.log(`[CF Sync] Processing batch of ${users.length} users (total so far: ${counters.total})`);

    // ── Process strictly one user at a time ──────────────────────────────────
    for (const user of users) {
      // Enforce CF rate limit: wait between users (skip before the very first)
      if (!isFirst) await sleep(cfDelay);
      isFirst = false;

      const result = await syncOneUser(user, counters);

      if (result.success) {
        counters.success++;
      } else {
        counters.failed++;
        counters.errors.push({ userId: result.userId, error: result.error });
        console.error(`[CF Sync] Failed user ${result.userId} (${user.codeforcesUsername}): ${result.error}`);
      }
    }
  }

  console.log(
    `[CF Sync] Done — total=${counters.total}, success=${counters.success}, ` +
    `failed=${counters.failed}, rateLimitRetries=${counters.rateLimitRetries}`
  );

  return counters;
};
