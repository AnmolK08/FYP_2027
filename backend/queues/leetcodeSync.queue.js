import { Queue } from 'bullmq';
import { redisClient, isRedisReady, getRedisUrl } from '../config/redis.js';
import { syncLockKey, SYNC_LOCK_TTL } from '../utils/redisKeys.js';

/**
 * LeetCode Sync Queue (BullMQ)
 * ----------------------------
 * Manages async LeetCode synchronization jobs.
 * Uses a Redis-based dedup lock to prevent duplicate concurrent syncs
 * for the same user.
 */

let syncQueue = null;

/**
 * Initialise the BullMQ queue.
 * Call after Redis is connected.
 */
export const initSyncQueue = () => {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    console.warn('[SyncQueue] No REDIS_URL — queue unavailable');
    return;
  }

  try {
    // BullMQ requires IORedis-style connection options
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

/**
 * Returns true if the queue is available for accepting jobs.
 */
export const isQueueReady = () => syncQueue !== null;

/**
 * Add a LeetCode sync job for a user.
 * Uses a Redis lock to prevent duplicate concurrent jobs.
 *
 * @param {string} userId
 * @returns {{ queued: boolean, reason?: string }}
 */
export const addSyncJob = async (userId) => {
  if (!syncQueue) {
    return { queued: false, reason: 'Queue unavailable' };
  }

  // Dedup: acquire a per-user sync lock
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
      // Continue without lock — job may run slightly duplicated
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
    // Release lock on failure
    if (isRedisReady()) {
      try {
        await redisClient.del(syncLockKey(userId));
      } catch { /* ignore */ }
    }
    return { queued: false, reason: 'Failed to enqueue job' };
  }
};

export { syncQueue };
