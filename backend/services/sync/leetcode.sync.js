// Batch LeetCode sync engine for the daily cron job.
//
// Paginates DB reads with a cursor so memory stays flat regardless of user count.
// p-limit caps concurrent API requests to avoid hammering the LeetCode GraphQL endpoint.
// Per-user failures are isolated — one bad username never aborts the whole batch.
// Reuses fetchAndParseLeetcodeData + persistLeetcodeData so there's no duplicated sync logic.

import pLimit from 'p-limit';
import prisma from '../../config/prisma.js';
import { sleep } from '../../utils/sleep.js';
import {
  fetchAndParseLeetcodeData,
  persistLeetcodeData,
} from '../leetcode.service.js';
import { calcLucyScore } from '../../utils/scoring.js';

const BATCH_SIZE   = parseInt(process.env.CRON_BATCH_SIZE          || '100', 10);
const CONCURRENCY  = parseInt(process.env.CRON_LC_CONCURRENCY      || '5',   10);
const RETRY_COUNT  = parseInt(process.env.CRON_RETRY_COUNT         || '3',   10);
const BASE_DELAY   = parseInt(process.env.CRON_RETRY_BASE_DELAY_MS || '5000', 10);

const syncOneUser = async (user, { retryCount, baseDelay }, counters) => {
  let attempt = 0;

  while (attempt <= retryCount) {
    try {
      const parsed = await fetchAndParseLeetcodeData(user.leetcodeUsername);
      const stats  = await persistLeetcodeData(user.id, parsed);

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
      const isRateLimit   = err.statusCode === 429;
      const isTransient   = isRateLimit || err.statusCode >= 500 || !err.statusCode;
      const isLastAttempt = attempt === retryCount;

      if (isRateLimit) counters.rateLimitRetries++;

      if (isTransient && !isLastAttempt) {
        // Exponential backoff: 5s → 10s → 20s
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `[LC Sync] User ${user.id} (${user.leetcodeUsername}) attempt ${attempt + 1} failed ` +
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
  let   cursor  = undefined;
  let   hasMore = true;

  console.log(`[LC Sync] Starting — batchSize=${batchSize}, concurrency=${concurrency}, retryCount=${retryCount}`);

  while (hasMore) {
    const users = await prisma.user.findMany({
      where: {
        leetcodeUsername: { not: null },
        NOT: { leetcodeUsername: '' },
      },
      select: { id: true, leetcodeUsername: true },
      take:   batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' }, // stable sort is required for cursor pagination to work correctly
    });

    if (users.length === 0) { hasMore = false; break; }

    cursor  = users[users.length - 1].id;
    hasMore = users.length === batchSize;

    counters.total += users.length;
    console.log(`[LC Sync] Processing batch of ${users.length} users (total so far: ${counters.total})`);

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
