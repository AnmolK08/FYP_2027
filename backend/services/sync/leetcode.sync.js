/**
 * leetcode.sync.js
 *
 * Batch LeetCode sync engine for the daily cron job.
 *
 * Design goals
 * ───────────────────────────────────────────────────────────────────────────
 * • Paginate DB reads — never loads all users into memory at once.
 * • Controlled concurrency via p-limit (default: 5 parallel LC requests).
 * • Exponential-backoff retry on 429 / 5xx transient failures.
 * • Per-user failure is isolated — one bad user never aborts the batch.
 * • Never overwrites valid existing data when a request temporarily fails.
 * • Reuses the existing fetchAndParseLeetcodeData + persistLeetcodeData
 *   service functions so there is zero duplicated sync logic.
 * • Returns structured counters for the orchestrator's logging.
 */

import pLimit from 'p-limit';
import prisma from '../../config/prisma.js';
import { sleep } from '../../utils/sleep.js';
import {
  fetchAndParseLeetcodeData,
  persistLeetcodeData,
} from '../leetcode.service.js';
import { calcLucyScore } from '../../utils/scoring.js';

// ─── Config (all overridable via env vars set before the cron fires) ──────────

const BATCH_SIZE   = parseInt(process.env.CRON_BATCH_SIZE          || '100', 10);
const CONCURRENCY  = parseInt(process.env.CRON_LC_CONCURRENCY      || '5',   10);
const RETRY_COUNT  = parseInt(process.env.CRON_RETRY_COUNT         || '3',   10);
const BASE_DELAY   = parseInt(process.env.CRON_RETRY_BASE_DELAY_MS || '5000', 10);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch + parse + persist LeetCode data for a single user with retries.
 * Returns `{ success: true, userId }` or `{ success: false, userId, error }`.
 *
 * @param {{ id: string, leetcodeUsername: string }} user
 * @param {{ retryCount: number, baseDelay: number }} opts
 * @param {object} counters – mutable shared counter object for rate-limit tracking
 */
const syncOneUser = async (user, { retryCount, baseDelay }, counters) => {
  let attempt = 0;

  while (attempt <= retryCount) {
    try {
      // 1. Fetch fresh data from LeetCode GraphQL
      const parsed = await fetchAndParseLeetcodeData(user.leetcodeUsername);

      // 2. Persist to PostgreSQL (upsert — safe to re-run)
      const stats = await persistLeetcodeData(user.id, parsed);

      // 3. Recompute lucyScore = new leetcodeScore + current codeforcesScore
      const cfStats = await prisma.codeforcesStats.findUnique({
        where:  { userId: user.id },
        select: { codeforcesScore: true },
      });
      const cfScore   = cfStats?.codeforcesScore ?? 0;
      const lucyScore = calcLucyScore(stats.leetcodeScore, cfScore);

      await prisma.user.update({
        where: { id: user.id },
        data:  { lucyScore },
      });

      return { success: true, userId: user.id, leetcodeScore: stats.leetcodeScore, lucyScore };
    } catch (err) {
      const isRateLimit  = err.statusCode === 429;
      const isTransient  = isRateLimit || err.statusCode >= 500 || !err.statusCode;
      const isLastAttempt = attempt === retryCount;

      if (isRateLimit) counters.rateLimitRetries++;

      if (isTransient && !isLastAttempt) {
        // Exponential backoff: 5s, 10s, 20s …
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `[LC Sync] User ${user.id} (${user.leetcodeUsername}) attempt ${attempt + 1} failed ` +
          `(${err.statusCode || 'network'}) — retrying in ${delay}ms`
        );
        await sleep(delay);
        attempt++;
        continue;
      }

      // Non-transient (404 user-not-found) or exhausted retries — give up for this user.
      return { success: false, userId: user.id, error: err.message || String(err) };
    }
  }

  // Should be unreachable, but guard anyway
  return { success: false, userId: user.id, error: 'Exhausted retries' };
};

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Sync ALL users who have a LeetCode username connected.
 *
 * Uses cursor-based pagination so memory usage stays flat regardless of
 * how many users exist.
 *
 * @param {object} [opts]
 * @param {number} [opts.batchSize]   – DB page size (default: BATCH_SIZE env)
 * @param {number} [opts.concurrency] – parallel API requests (default: CONCURRENCY env)
 * @param {number} [opts.retryCount]  – per-user retry limit (default: RETRY_COUNT env)
 * @param {number} [opts.baseDelay]   – backoff base in ms (default: BASE_DELAY env)
 *
 * @returns {Promise<{
 *   total:            number,
 *   success:          number,
 *   failed:           number,
 *   rateLimitRetries: number,
 *   errors:           Array<{ userId: string, error: string }>,
 * }>}
 */
export const runLeetcodeSync = async ({
  batchSize   = BATCH_SIZE,
  concurrency = CONCURRENCY,
  retryCount  = RETRY_COUNT,
  baseDelay   = BASE_DELAY,
} = {}) => {
  const counters = {
    total:            0,
    success:          0,
    failed:           0,
    rateLimitRetries: 0,
    errors:           [],
  };

  const limit   = pLimit(concurrency);
  let   cursor  = undefined; // cursor-based pagination (undefined = start from beginning)
  let   hasMore = true;

  console.log(`[LC Sync] Starting — batchSize=${batchSize}, concurrency=${concurrency}, retryCount=${retryCount}`);

  while (hasMore) {
    // ── Fetch one page of LC-connected users ────────────────────────────────
    const users = await prisma.user.findMany({
      where: {
        leetcodeUsername: { not: null },
        // Exclude empty strings
        NOT: { leetcodeUsername: '' },
      },
      select: { id: true, leetcodeUsername: true },
      take:   batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' }, // stable sort required for cursor pagination
    });

    if (users.length === 0) { hasMore = false; break; }

    // Advance cursor to the last user in this page
    cursor  = users[users.length - 1].id;
    hasMore = users.length === batchSize;

    counters.total += users.length;
    console.log(`[LC Sync] Processing batch of ${users.length} users (total so far: ${counters.total})`);

    // ── Dispatch the batch with controlled concurrency ───────────────────────
    const batchResults = await Promise.all(
      users.map((user) =>
        limit(() => syncOneUser(user, { retryCount, baseDelay }, counters))
      )
    );

    for (const result of batchResults) {
      if (result.success) {
        counters.success++;
      } else {
        counters.failed++;
        counters.errors.push({ userId: result.userId, error: result.error });
        console.error(`[LC Sync] Failed user ${result.userId}: ${result.error}`);
      }
    }
  }

  console.log(
    `[LC Sync] Done — total=${counters.total}, success=${counters.success}, ` +
    `failed=${counters.failed}, rateLimitRetries=${counters.rateLimitRetries}`
  );

  return counters;
};
