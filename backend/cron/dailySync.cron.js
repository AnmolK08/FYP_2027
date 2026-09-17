/**
 * dailySync.cron.js
 *
 * Registers the daily platform sync cron job using node-cron.
 *
 * Schedule (defaults)
 * ───────────────────────────────────────────────────────────────────────────
 *   CRON_SCHEDULE  = "30 22 * * *"  → 22:30 UTC = 04:00 AM IST
 *   CRON_TIMEZONE  = "Asia/Kolkata"
 *
 * Reliability guarantees
 * ───────────────────────────────────────────────────────────────────────────
 * • Distributed lock (Redis SET NX EX) prevents more than one instance
 *   of the job from running at the same time (multi-replica / restarts).
 * • If the job crashes mid-run the lock auto-expires after CRON_LOCK_TTL
 *   seconds (default 7200 = 2 hours) so the next scheduled run isn't blocked.
 * • If Redis is unavailable the job still runs — the lock is best-effort.
 * • All sync logic lives in platformSync.service.js; this file is
 *   purely the scheduler + distributed-lock wrapper.
 */

import cron             from 'node-cron';
import { redisClient, isRedisReady } from '../config/redis.js';
import { runFullPlatformSync }       from '../services/sync/platformSync.service.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const SCHEDULE  = process.env.CRON_SCHEDULE || '30 22 * * *'; // 04:00 IST
const TIMEZONE  = process.env.CRON_TIMEZONE || 'Asia/Kolkata';
const LOCK_TTL  = parseInt(process.env.CRON_LOCK_TTL || '7200', 10); // seconds

const LOCK_KEY  = 'lock:cron:daily-platform-sync';
const LOCK_VAL  = process.env.HOSTNAME || `lucy-cron-${Date.now()}`;

// ─── Lock helpers ─────────────────────────────────────────────────────────────

/**
 * Try to acquire the distributed cron lock.
 * Returns true if the lock was acquired, false if another instance holds it.
 */
const acquireLock = async () => {
  if (!isRedisReady()) {
    // Redis unavailable — run without lock (best-effort single-instance)
    console.warn('[Cron] Redis unavailable — running without distributed lock');
    return true;
  }
  try {
    const result = await redisClient.set(LOCK_KEY, LOCK_VAL, {
      NX: true, // only set if key does not exist
      EX: LOCK_TTL,
    });
    return result === 'OK';
  } catch (err) {
    console.error('[Cron] Lock acquisition failed:', err.message);
    // On Redis error, allow the job to run (avoid silent skip on every node)
    return true;
  }
};

/**
 * Release the distributed lock only if we still own it.
 * Uses a Lua script for atomic check-and-delete.
 */
const releaseLock = async () => {
  if (!isRedisReady()) return;
  try {
    // Lua: only DEL the key if the value matches our LOCK_VAL (we own it)
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

// ─── Job handler ─────────────────────────────────────────────────────────────

const runJob = async () => {
  const startedAt = new Date().toISOString();
  console.log(`\n[Cron] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[Cron] Daily platform sync triggered at ${startedAt}`);

  // ── 1. Acquire distributed lock ────────────────────────────────────────────
  const locked = await acquireLock();
  if (!locked) {
    console.warn('[Cron] Another instance is already running — skipping this tick');
    return;
  }

  console.log(`[Cron] Lock acquired (key=${LOCK_KEY}, TTL=${LOCK_TTL}s)`);

  // ── 2. Run the full sync pipeline ──────────────────────────────────────────
  try {
    await runFullPlatformSync();
  } catch (err) {
    // Unexpected top-level crash — log and release lock so next run isn't blocked
    console.error('[Cron] FATAL — sync pipeline threw an unhandled error:', err);
  } finally {
    // ── 3. Always release the lock ────────────────────────────────────────────
    await releaseLock();
    console.log('[Cron] Lock released');
    console.log(`[Cron] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
};

// ─── Registration ─────────────────────────────────────────────────────────────

let _task = null;

/**
 * Register and start the daily cron job.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export const startDailySyncCron = () => {
  // Never run the cron job inside Vercel serverless functions
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

/**
 * Stop the cron job (useful for graceful shutdown or tests).
 */
export const stopDailySyncCron = () => {
  if (_task) {
    _task.stop();
    _task = null;
    console.log('[Cron] Daily platform sync cron stopped');
  }
};

/**
 * Trigger the job immediately (bypasses the schedule).
 * Used by scripts/run-sync-now.js and admin endpoints.
 */
export const triggerSyncNow = runJob;
