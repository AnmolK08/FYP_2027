/**
 * platformSync.service.js
 *
 * Orchestrates the full daily platform sync:
 *
 *   1. Run LeetCode batch sync  (all LC-connected users)
 *   2. Run Codeforces batch sync (all CF-connected users, 1 req / 2s)
 *   3. Rebuild all three Redis leaderboard ZSETs from PostgreSQL
 *
 * Design decisions
 * ───────────────────────────────────────────────────────────────────────────
 * • LeetCode and Codeforces syncs run SEQUENTIALLY, not in parallel.
 *   This avoids saturating the DB connection pool or the Redis client during
 *   what is already a heavy background job.
 * • Leaderboard rebuild happens ONCE, after BOTH platform syncs finish.
 *   We never touch Redis ZSETs per-user during the cron — that would create
 *   a partially-stale leaderboard visible to users mid-job.
 * • PostgreSQL is the source of truth throughout. Redis is rebuilt from DB.
 * • This function is called by both the cron scheduler (dailySync.cron.js)
 *   and the one-shot local trigger script (scripts/run-sync-now.js).
 *   The distributed lock lives in the cron layer, not here.
 */

import { runLeetcodeSync }    from './leetcode.sync.js';
import { runCodeforcesSync }  from './codeforces.sync.js';
import { rebuildLeaderboard } from '../leaderboard.service.js';

/**
 * Execute the full daily platform sync pipeline.
 *
 * @param {object}  [opts]
 * @param {boolean} [opts.skipLC=false]  – skip LeetCode sync (useful for testing CF-only)
 * @param {boolean} [opts.skipCF=false]  – skip Codeforces sync
 * @param {boolean} [opts.skipLB=false]  – skip leaderboard rebuild
 *
 * @returns {Promise<{
 *   startedAt:    string,       // ISO timestamp
 *   finishedAt:   string,       // ISO timestamp
 *   durationMs:   number,
 *   leetcode:     object|null,  // counters from runLeetcodeSync
 *   codeforces:   object|null,  // counters from runCodeforcesSync
 *   leaderboard:  object|null,  // rebuild result
 * }>}
 */
export const runFullPlatformSync = async ({
  skipLC = false,
  skipCF = false,
  skipLB = false,
} = {}) => {
  const startedAt  = new Date();
  const startMs    = Date.now();

  const report = {
    startedAt:   startedAt.toISOString(),
    finishedAt:  null,
    durationMs:  null,
    leetcode:    null,
    codeforces:  null,
    leaderboard: null,
  };

  // ── 1. LeetCode ────────────────────────────────────────────────────────────
  if (!skipLC) {
    console.log('\n════════════════════════════════════════════');
    console.log('[Sync] Phase 1 / 3 — LeetCode sync starting…');
    console.log('════════════════════════════════════════════');
    try {
      report.leetcode = await runLeetcodeSync();
    } catch (err) {
      // A crash in the LC phase must not block the CF phase or leaderboard rebuild
      console.error('[Sync] LeetCode sync phase crashed:', err.message || err);
      report.leetcode = { crashed: true, error: err.message || String(err) };
    }
  } else {
    console.log('[Sync] Phase 1 / 3 — LeetCode sync SKIPPED');
  }

  // ── 2. Codeforces ──────────────────────────────────────────────────────────
  if (!skipCF) {
    console.log('\n════════════════════════════════════════════');
    console.log('[Sync] Phase 2 / 3 — Codeforces sync starting…');
    console.log('════════════════════════════════════════════');
    try {
      report.codeforces = await runCodeforcesSync();
    } catch (err) {
      console.error('[Sync] Codeforces sync phase crashed:', err.message || err);
      report.codeforces = { crashed: true, error: err.message || String(err) };
    }
  } else {
    console.log('[Sync] Phase 2 / 3 — Codeforces sync SKIPPED');
  }

  // ── 3. Leaderboard rebuild ─────────────────────────────────────────────────
  // Rebuild all three ZSETs (leetcode / codeforces / lucy) from PostgreSQL
  // in one atomic operation per board.  Redis is the ranking/cache layer only;
  // PostgreSQL scores written during phases 1 & 2 are the source of truth.
  if (!skipLB) {
    console.log('\n════════════════════════════════════════════');
    console.log('[Sync] Phase 3 / 3 — Leaderboard rebuild starting…');
    console.log('════════════════════════════════════════════');
    try {
      // rebuildLeaderboard(undefined) triggers all three boards in parallel
      report.leaderboard = await rebuildLeaderboard(undefined);
      console.log('[Sync] Leaderboard rebuild result:', JSON.stringify(report.leaderboard));
    } catch (err) {
      console.error('[Sync] Leaderboard rebuild crashed:', err.message || err);
      report.leaderboard = { crashed: true, error: err.message || String(err) };
    }
  } else {
    console.log('[Sync] Phase 3 / 3 — Leaderboard rebuild SKIPPED');
  }

  // ── Final report ───────────────────────────────────────────────────────────
  report.finishedAt  = new Date().toISOString();
  report.durationMs  = Date.now() - startMs;

  const durationMin = (report.durationMs / 60_000).toFixed(1);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║       DAILY PLATFORM SYNC — COMPLETE         ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Started:    ${report.startedAt}`);
  console.log(`  Finished:   ${report.finishedAt}`);
  console.log(`  Duration:   ${durationMin} min (${report.durationMs} ms)`);

  if (report.leetcode && !report.leetcode.crashed) {
    console.log(`  LC  →  total=${report.leetcode.total}  ✓=${report.leetcode.success}  ✗=${report.leetcode.failed}  retries=${report.leetcode.rateLimitRetries}`);
  }
  if (report.codeforces && !report.codeforces.crashed) {
    console.log(`  CF  →  total=${report.codeforces.total}  ✓=${report.codeforces.success}  ✗=${report.codeforces.failed}  retries=${report.codeforces.rateLimitRetries}`);
  }
  if (report.leaderboard) {
    console.log(`  LB  →  ${JSON.stringify(report.leaderboard)}`);
  }
  console.log('');

  return report;
};
