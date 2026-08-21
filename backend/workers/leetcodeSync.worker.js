import { Worker } from 'bullmq';
import prisma from '../config/prisma.js';
import { redisClient, isRedisReady, getRedisUrl } from '../config/redis.js';
import { syncLockKey } from '../utils/redisKeys.js';
import {
  fetchAndParseLeetcodeData,
  persistLeetcodeData,
  postSyncRedisUpdates,
} from '../services/leetcode.service.js';

/**
 * LeetCode Sync Worker (BullMQ)
 * -----------------------------
 * Processes async sync jobs. Flow:
 *   1. Look up the user's LeetCode username
 *   2. Fetch + parse LeetCode data (reuses service logic)
 *   3. Persist to PostgreSQL (source of truth)
 *   4. Update Redis caches ONLY after PostgreSQL succeeds
 *   5. Release the dedup lock
 */

let syncWorker = null;

/**
 * Start the BullMQ worker.
 * Call after Redis is connected. Runs in the same process as Express.
 */
export const startSyncWorker = () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    console.warn('[SyncWorker] No REDIS_URL — worker not started');
    return;
  }

  try {
    const url = new URL(redisUrl);
    const connection = {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
    };
    if (url.password) connection.password = url.password;

    syncWorker = new Worker(
      'leetcode-sync',
      async (job) => {
        const { userId } = job.data;
        console.log(`[SyncWorker] Processing sync for user ${userId}`);

        try {
          // 1. Get user's LeetCode username
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { leetcodeUsername: true },
          });

          if (!user || !user.leetcodeUsername) {
            console.warn(`[SyncWorker] User ${userId} has no LeetCode username — skipping`);
            return;
          }

          // 2. Fetch + parse from LeetCode API
          const parsedData = await fetchAndParseLeetcodeData(user.leetcodeUsername);

          // 3. Persist to PostgreSQL (source of truth)
          const stats = await persistLeetcodeData(userId, parsedData);

          // 4. Update Redis caches ONLY after PostgreSQL succeeds
          await postSyncRedisUpdates(userId, stats.universalScore);

          console.log(`[SyncWorker] Sync completed for user ${userId} — score: ${stats.universalScore}`);
        } catch (err) {
          console.error(`[SyncWorker] Sync failed for user ${userId}:`, err.message);
          throw err; // Let BullMQ handle retries
        } finally {
          // 5. Release the dedup lock
          if (isRedisReady()) {
            try {
              await redisClient.del(syncLockKey(userId));
            } catch (lockErr) {
              console.error(`[SyncWorker] Failed to release lock for ${userId}:`, lockErr.message);
            }
          }
        }
      },
      {
        connection,
        concurrency: 3, // Process up to 3 sync jobs concurrently
      }
    );

    syncWorker.on('completed', (job) => {
      console.log(`[SyncWorker] Job ${job.id} completed`);
    });

    syncWorker.on('failed', (job, err) => {
      console.error(`[SyncWorker] Job ${job?.id} failed:`, err.message);
    });

    syncWorker.on('error', (err) => {
      // Suppress noisy connection errors when Redis is offline
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED') || err instanceof AggregateError) {
        return;
      }
      console.error('[SyncWorker] Worker error:', err.message || err);
    });

    console.log('[SyncWorker] Worker started (concurrency: 3)');
  } catch (err) {
    console.error('[SyncWorker] Failed to start worker:', err.message);
  }
};

export { syncWorker };
