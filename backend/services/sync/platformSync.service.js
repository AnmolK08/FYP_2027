// Orchestrates the full daily platform sync in three phases:
//   1. LeetCode batch sync  — all LC-connected users
//   2. Codeforces batch sync — all CF-connected users (1 req/2s)
//   3. Leaderboard rebuild  — all three Redis ZSETs rebuilt from PostgreSQL
//
// The two platform syncs run sequentially (not in parallel) to avoid
// saturating the DB connection pool during what is already a heavy background job.
// Leaderboard ZSETs are only updated once, after both syncs finish, so users
// never see a partially-stale leaderboard mid-job.
//
// The distributed lock lives in the cron layer (dailySync.cron.js), not here,
// so this function can also be called directly from run-sync-now.js.

import { runLeetcodeSync }    from './leetcode.sync.js';
import { runCodeforcesSync }  from './codeforces.sync.js';
import { rebuildLeaderboard } from '../leaderboard.service.js';

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

  if (!skipLC) {
    console.log('\n════════════════════════════════════════════');
    console.log('[Sync] Phase 1 / 3 — LeetCode sync starting…');
    console.log('════════════════════════════════════════════');
    try {
      report.leetcode = await runLeetcodeSync();
    } catch (err) {
      // LC crash must not prevent CF sync or leaderboard rebuild
      console.error('[Sync] LeetCode sync phase crashed:', err.message || err);
      report.leetcode = { crashed: true, error: err.message || String(err) };
    }
  } else {
    console.log('[Sync] Phase 1 / 3 — LeetCode sync SKIPPED');
  }

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

  if (!skipLB) {
    console.log('\n════════════════════════════════════════════');
    console.log('[Sync] Phase 3 / 3 — Leaderboard rebuild starting…');
    console.log('════════════════════════════════════════════');
    try {
      // Pass undefined to trigger all three boards in parallel
      report.leaderboard = await rebuildLeaderboard(undefined);
      console.log('[Sync] Leaderboard rebuild result:', JSON.stringify(report.leaderboard));
    } catch (err) {
      console.error('[Sync] Leaderboard rebuild crashed:', err.message || err);
      report.leaderboard = { crashed: true, error: err.message || String(err) };
    }
  } else {
    console.log('[Sync] Phase 3 / 3 — Leaderboard rebuild SKIPPED');
  }

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
