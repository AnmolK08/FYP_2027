import { Queue } from 'bullmq';
import { redisClient, isRedisReady, getRedisUrl } from '../config/redis.js';
import { syncLockKey, SYNC_LOCK_TTL } from '../utils/redisKeys.js';

let syncQueue = null;

export const initSyncQueue = () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl || (process.env.VERCEL && redisUrl.includes('localhost'))) {
    console.warn('[SyncQueue] No valid remote REDIS_URL — queue unavailable');
    return;
  }

  try {
    // BullMQ needs IORedis-style connection options, not the redis:// URL string
    const url = new URL(redisUrl);
    const connection = {
      host: url.hostname,
      port: parseInt(url.port, 10) || 6379,
    };
    if (url.password) connection.password = url.password;

    syncQueue = new Queue('leetcode-sync', { connection });
    
    syncQueue.on('error', (err) => {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED') || err instanceof AggregateError) {
        return;
      }
      console.error('[SyncQueue] Queue error:', err.message || err);
    });

    console.log('[SyncQueue] Queue initialised');
  } catch (err) {
    console.error('[SyncQueue] Failed to initialise queue:', err.message);
  }
};

export const isQueueReady = () => syncQueue !== null;

// Acquires a per-user Redis lock before enqueuing to prevent duplicate concurrent
// sync jobs for the same user. The lock is released by the worker after completion.
export const addSyncJob = async (userId) => {
  if (!syncQueue) {
    return { queued: false, reason: 'Queue unavailable' };
  }

  if (isRedisReady()) {
    try {
      const lockAcquired = await redisClient.set(
        syncLockKey(userId),
        '1',
        { NX: true, EX: SYNC_LOCK_TTL }
      );

      if (!lockAcquired) {
        return { queued: false, reason: 'Sync already in progress' };
      }
    } catch (err) {
      console.error('[SyncQueue] Lock acquisition failed:', err.message);
    }
  }

  try {
    await syncQueue.add(
      'sync',
      { userId },
      {
        jobId: `sync-${userId}-${Date.now()}`,
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );

    return { queued: true };
  } catch (err) {
    console.error('[SyncQueue] Failed to add job:', err.message);
    if (isRedisReady()) {
      try {
        await redisClient.del(syncLockKey(userId));
      } catch { /* ignore */ }
    }
    return { queued: false, reason: 'Failed to enqueue job' };
  }
};

export { syncQueue };
