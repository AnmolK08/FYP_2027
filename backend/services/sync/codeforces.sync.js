// Batch Codeforces sync engine for the daily cron job.
//
// CF enforces ~1 req/2s per IP on user.status so concurrency is hardcoded to 1.
// Each user triggers three sequential CF API calls (user.info → user.status → user.rating)
// and the result is written to the DB before the next user starts.
// The CRON_CF_DELAY_MS gap (default 2100ms) between users satisfies the rate limit.
// Cursor-based DB pagination keeps memory flat across all users.
// Reuses fetchUserInfo/Status/Rating + buildCodeforcesPayload + persistCodeforcesData
// from the existing service layer — no duplicated logic.

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

const BATCH_SIZE  = parseInt(process.env.CRON_BATCH_SIZE          || '100',  10);
const CF_DELAY    = parseInt(process.env.CRON_CF_DELAY_MS         || '2100', 10);
const RETRY_COUNT = parseInt(process.env.CRON_RETRY_COUNT         || '3',    10);
const BASE_DELAY  = parseInt(process.env.CRON_RETRY_BASE_DELAY_MS || '5000', 10);

const syncOneUser = async (user, counters) => {
  const handle = user.codeforcesUsername.trim();
  let attempt = 0;

  while (attempt <= RETRY_COUNT) {
    try {
      // Three calls must be sequential — CF rate limit is per-IP, not per-user
      const cfUser        = await fetchUserInfo(handle);
      const submissions   = await fetchUserStatus(handle);
      const ratingChanges = await fetchUserRating(handle);

      const payload = buildCodeforcesPayload(cfUser, submissions, ratingChanges);

      const codeforcesScore = calcCodeforcesScore({
        rating:           payload.rating,
        ratingWiseSolved: payload.ratingWiseSolved,
      });
      payload.codeforcesScore = codeforcesScore;

      await persistCodeforcesData(user.id, payload);

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
        // On a 429, back off much longer than the normal inter-user gap
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

      return { success: false, userId: user.id, error: err.message || String(err) };
    }
  }

  return { success: false, userId: user.id, error: 'Exhausted retries' };
};

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
  let isFirst = true;

  console.log(`[CF Sync] Starting — batchSize=${batchSize}, cfDelay=${cfDelay}ms, retryCount=${RETRY_COUNT}`);

  while (hasMore) {
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

    for (const user of users) {
      // Skip the delay before the very first user; every subsequent user must wait
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
