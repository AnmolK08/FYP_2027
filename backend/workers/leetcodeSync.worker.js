import { Worker } from 'bullmq';
import prisma from '../config/prisma.js';
import { redisClient, isRedisReady, getRedisUrl } from '../config/redis.js';
import { syncLockKey } from '../utils/redisKeys.js';
import {
  fetchAndParseLeetcodeData,
  persistLeetcodeData,
  postSyncRedisUpdates,
} from '../services/leetcode.service.js';

let syncWorker = null;

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
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { leetcodeUsername: true },
          });

          if (!user || !user.leetcodeUsername) {
            console.warn(`[SyncWorker] User ${userId} has no LeetCode username — skipping`);
            return;
          }

          const parsedData = await fetchAndParseLeetcodeData(user.leetcodeUsername);
          const stats = await persistLeetcodeData(userId, parsedData);

          await postSyncRedisUpdates(userId, stats.universalScore);

          console.log(`[SyncWorker] Sync completed for user ${userId} — score: ${stats.universalScore}`);
        } catch (err) {
          console.error(`[SyncWorker] Sync failed for user ${userId}:`, err.message);
          throw err;
        } finally {
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
        concurrency: 3,
      }
    );

    syncWorker.on('completed', (job) => {
      console.log(`[SyncWorker] Job ${job.id} completed`);
    });

    syncWorker.on('failed', (job, err) => {
      console.error(`[SyncWorker] Job ${job?.id} failed:`, err.message);
    });

    syncWorker.on('error', (err) => {
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
