#!/usr/bin/env node
// One-shot script that runs the full daily platform sync immediately.
// Useful for local testing, manual catch-up runs, or CI pipelines.
//
// Usage:
//   node --env-file=.env scripts/run-sync-now.js [--skip-lc] [--skip-cf] [--skip-lb]
//
// Exit codes:
//   0  All phases completed (per-user failures do NOT set exit 1)
//   1  A phase crashed entirely, or Redis/DB connection failed

import 'dotenv/config';
import { connectRedis }        from '../config/redis.js';
import prisma                  from '../config/prisma.js';
import { runFullPlatformSync } from '../services/sync/platformSync.service.js';

// Parse CLI flags

const args   = process.argv.slice(2);
const skipLC = args.includes('--skip-lc');
const skipCF = args.includes('--skip-cf');
const skipLB = args.includes('--skip-lb');

// Main

const main = async () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       LUCY — RUN SYNC NOW (manual trigger)   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Started at : ${new Date().toISOString()}`);
  console.log(`  Skip LC    : ${skipLC}`);
  console.log(`  Skip CF    : ${skipCF}`);
  console.log(`  Skip LB    : ${skipLB}`);
  console.log('');

  // ── Connect Redis (non-fatal — leaderboard rebuild will warn if unavailable)
  try {
    await connectRedis();
    console.log('[RunSyncNow] Redis connected');
  } catch (err) {
    console.warn('[RunSyncNow] Redis connection failed — continuing without Redis cache:', err.message);
  }

  // Run the pipeline
  let report;
  try {
    report = await runFullPlatformSync({ skipLC, skipCF, skipLB });
  } catch (err) {
    console.error('[RunSyncNow] FATAL — pipeline threw an unhandled error:', err);
    await prisma.$disconnect();
    process.exit(1);
  }

  // Disconnect Prisma cleanly
  await prisma.$disconnect();

  // Determine exit code
  // Phase-level crashes (not per-user failures) are flagged with report.*.crashed
  const anyCrash =
    report.leetcode?.crashed  ||
    report.codeforces?.crashed ||
    report.leaderboard?.crashed;

  if (anyCrash) {
    console.error('[RunSyncNow] One or more phases crashed — see logs above for details');
    process.exit(1);
  }

  console.log('[RunSyncNow] All phases completed successfully');
  process.exit(0);
};

main().catch((err) => {
  console.error('[RunSyncNow] Unexpected fatal error:', err);
  process.exit(1);
});
