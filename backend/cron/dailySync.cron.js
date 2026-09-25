// Daily platform sync cron job.
// Default schedule: 22:30 UTC = 04:00 AM IST (CRON_SCHEDULE / CRON_TIMEZONE env vars).

// Distributed lock (Redis SET NX EX) prevents two instances from running simultaneously
// in a multi-replica deployment. If the job crashes, the lock expires after CRON_LOCK_TTL
// seconds so the next scheduled run isn't stuck. Redis failure is non-fatal — the job
// runs without a lock rather than silently skipping.

import cron             from 'node-cron';
import { redisClient, isRedisReady } from '../config/redis.js';
import { runFullPlatformSync }       from '../services/sync/platformSync.service.js';

const SCHEDULE  = process.env.CRON_SCHEDULE || '30 22 * * *';
const TIMEZONE  = process.env.CRON_TIMEZONE || 'Asia/Kolkata';
const LOCK_TTL  = parseInt(process.env.CRON_LOCK_TTL || '7200', 10);

const LOCK_KEY  = 'lock:cron:daily-platform-sync';
// Use the hostname to tell replicas apart in logs and in the ownership check
const LOCK_VAL  = process.env.HOSTNAME || `lucy-cron-${Date.now()}`;

// Lock helpers


// Try to acquire the distributed cron lock.
// Returns true if the lock was acquired, false if another instance holds it.
 
const acquireLock = async () => {
  if (!isRedisReady()) {
    console.warn('[Cron] Redis unavailable — running without distributed lock');
    return true;
  }
  try {
    const result = await redisClient.set(LOCK_KEY, LOCK_VAL, {
      NX: true,
      EX: LOCK_TTL,
    });
    return result === 'OK';
  } catch (err) {
    console.error('[Cron] Lock acquisition failed:', err.message);
    // Allow the job to run rather than silently skipping on every node
    return true;
  }
};

// Atomic check-and-delete via Lua so we never accidentally release a lock
// that was acquired by a different replica after ours expired
const releaseLock = async () => {
  if (!isRedisReady()) return;
  try {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    await redisClient.eval(script, { keys: [LOCK_KEY], arguments: [LOCK_VAL] });
  } catch (err) {
    console.error('[Cron] Lock release failed (lock will expire naturally):', err.message);
  }
};

// Job handler

const runJob = async () => {
  const startedAt = new Date().toISOString();
  console.log(`\n[Cron] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[Cron] Daily platform sync triggered at ${startedAt}`);

  // 1.Acquire distributed lock
  const locked = await acquireLock();
  if (!locked) {
    console.warn('[Cron] Another instance is already running — skipping this tick');
    return;
  }

  console.log(`[Cron] Lock acquired (key=${LOCK_KEY}, TTL=${LOCK_TTL}s)`);

  //  2. Run the full sync pipeline 
  try {
    await runFullPlatformSync();
  } catch (err) {
    // Unexpected top-level crash — log and release lock so next run isn't blocked
    console.error('[Cron] FATAL — sync pipeline threw an unhandled error:', err);
  } finally {
    //  3. Always release the lock 
    await releaseLock();
    console.log('[Cron] Lock released');
    console.log(`[Cron] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
};

// Registration

let _task = null;

// Register and start the daily cron job.
// Safe to call multiple times — subsequent calls are no-ops.
export const startDailySyncCron = () => {
  // Vercel serverless functions can't run persistent cron tasks
  if (process.env.VERCEL) {
    console.log('[Cron] Vercel environment detected — daily sync cron disabled (use Vercel Cron)');
    return;
  }

  if (_task) {
    console.log('[Cron] Daily sync cron already registered — skipping duplicate start');
    return;
  }

  if (!cron.validate(SCHEDULE)) {
    console.error(`[Cron] Invalid CRON_SCHEDULE expression "${SCHEDULE}" — daily sync cron NOT started`);
    return;
  }

  _task = cron.schedule(SCHEDULE, runJob, {
    scheduled: true,
    timezone:  TIMEZONE,
  });

  console.log(`[Cron] Daily platform sync scheduled — "${SCHEDULE}" (${TIMEZONE})`);
};

//  Stop the cron job (useful for graceful shutdown or tests).
export const stopDailySyncCron = () => {
  if (_task) {
    _task.stop();
    _task = null;
    console.log('[Cron] Daily platform sync cron stopped');
  }
};

// Bypasses the schedule — used by scripts/run-sync-now.js and admin endpoints
export const triggerSyncNow = runJob;
