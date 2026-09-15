/**
 * backfill-lucy-scores.js
 *
 * One-shot migration script.  Reads every LeetcodeStats row, computes
 * leetcodeScore and lucyScore using the V1 scoring formulae, and writes
 * both back to the DB.  Safe to run multiple times (idempotent).
 *
 * lucyScore = leetcodeScore + codeforcesScore
 *   codeforcesScore = 0 when the user has no CodeforcesStats row yet.
 *
 * Usage:
 *   node --env-file=.env scripts/backfill-lucy-scores.js
 *
 * Or if your Node version doesn't support --env-file:
 *   npx dotenv -e .env -- node scripts/backfill-lucy-scores.js
 */

import 'dotenv/config';
import prisma from '../config/prisma.js';
import { calcLeetcodeScore, calcCodeforcesScore, calcLucyScore } from '../utils/scoring.js';

const BATCH_SIZE = 50; // rows processed per iteration

async function main() {
  console.log('▶  backfill-lucy-scores starting…\n');

  // Fetch all leetcode stats rows joined with user's codeforcesStats score
  const allStats = await prisma.leetcodeStats.findMany({
    select: {
      userId:        true,
      easy:          true,
      medium:        true,
      hard:          true,
      contestRating: true,
      user: {
        select: {
          codeforcesStats: {
            select: { codeforcesScore: true, totalSolved: true, rating: true },
          },
        },
      },
    },
  });

  console.log(`Found ${allStats.length} LeetcodeStats rows to process.\n`);

  let updated = 0;
  let skipped = 0;

  // Process in batches to avoid overwhelming the connection pool
  for (let i = 0; i < allStats.length; i += BATCH_SIZE) {
    const batch = allStats.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (row) => {
        const leetcodeScore = calcLeetcodeScore({
          easy:          row.easy          || 0,
          medium:        row.medium        || 0,
          hard:          row.hard          || 0,
          contestRating: row.contestRating || 0,
        });

        // Use stored codeforcesScore if it exists, otherwise 0
        const cfStats         = row.user?.codeforcesStats;
        const codeforcesScore = cfStats?.codeforcesScore
          ? cfStats.codeforcesScore
          : 0;

        const lucyScore = calcLucyScore(leetcodeScore, codeforcesScore);

        // Update leetcode_stats.leetcode_score
        await prisma.leetcodeStats.update({
          where: { userId: row.userId },
          data:  { leetcodeScore },
        });

        // Update users.lucy_score
        await prisma.user.update({
          where: { id: row.userId },
          data:  { lucyScore },
        });

        updated++;
      })
    );

    console.log(`  Processed ${Math.min(i + BATCH_SIZE, allStats.length)} / ${allStats.length}`);
  }

  // Also backfill codeforcesScore on any CodeforcesStats rows that have
  // a rating but codeforcesScore = 0 (i.e. synced before V1 scoring landed)
  const cfRows = await prisma.codeforcesStats.findMany({
    where: { codeforcesScore: 0, rating: { gt: 0 } },
    select: { userId: true, totalSolved: true, rating: true },
  });

  console.log(`\nFound ${cfRows.length} CodeforcesStats rows needing codeforcesScore backfill.`);

  for (let i = 0; i < cfRows.length; i += BATCH_SIZE) {
    const batch = cfRows.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (cf) => {
        const codeforcesScore = calcCodeforcesScore({
          totalSolved: cf.totalSolved || 0,
          rating:      cf.rating      || 0,
        });

        if (codeforcesScore === 0) return;

        await prisma.codeforcesStats.update({
          where: { userId: cf.userId },
          data:  { codeforcesScore },
        });

        // Re-fetch current leetcodeScore and recompute lucyScore
        const lc = await prisma.leetcodeStats.findUnique({
          where:  { userId: cf.userId },
          select: { leetcodeScore: true },
        });
        const lcScore   = lc?.leetcodeScore || 0;
        const lucyScore = calcLucyScore(lcScore, codeforcesScore);

        await prisma.user.update({
          where: { id: cf.userId },
          data:  { lucyScore },
        });

        updated++;
      })
    );
  }

  console.log(`\n✅  Done.  Updated ${updated} rows, skipped ${skipped}.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌  Backfill failed:', err);
  process.exit(1);
});
