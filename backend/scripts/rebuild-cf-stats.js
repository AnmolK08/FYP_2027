/**
 * rebuild-cf-stats.js
 *
 * Re-syncs Codeforces stats for every user that already has codeforcesUsername
 * set, using the new rating-wise scoring formula.
 *
 * Usage:
 *   node --env-file=.env scripts/rebuild-cf-stats.js
 *
 * What it does per user:
 *   1. Calls user.info, user.status (paginated), user.rating sequentially
 *   2. Builds ratingWiseSolved from OK verdicts, deduped by contestId+index
 *   3. Computes codeforcesScore = floor(rating/2) + Σ(count × (i+1))
 *   4. Upserts CodeforcesStats in DB
 *   5. Recomputes lucyScore = leetcodeScore + codeforcesScore
 *   6. Updates User.lucyScore in DB
 *
 * Rate-limit safe: 2-second gap between users.
 */

import 'dotenv/config';
import prisma from '../config/prisma.js';
import { fetchUserInfo, fetchUserStatus, fetchUserRating } from '../services/codeforces.provider.js';
import { buildCodeforcesPayload } from '../services/codeforces.mapper.js';
import { calcCodeforcesScore, calcLucyScore } from '../utils/scoring.js';

const INTER_USER_DELAY_MS = 2000; // 2 s gap between users to avoid CF rate-limit

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rebuildUser(user) {
  const handle = user.codeforcesUsername.trim();
  console.log(`  → [${handle}] fetching…`);

  const cfUser        = await fetchUserInfo(handle);
  const submissions   = await fetchUserStatus(handle);
  const ratingChanges = await fetchUserRating(handle);

  const payload = buildCodeforcesPayload(cfUser, submissions, ratingChanges);

  const codeforcesScore = calcCodeforcesScore({
    rating:           payload.rating,
    ratingWiseSolved: payload.ratingWiseSolved,
  });
  payload.codeforcesScore = codeforcesScore;

  const now = new Date();

  await prisma.codeforcesStats.upsert({
    where: { userId: user.id },
    update: {
      handle:           payload.handle,
      avatar:           payload.avatar,
      firstName:        payload.firstName,
      lastName:         payload.lastName,
      country:          payload.country,
      city:             payload.city,
      organization:     payload.organization,
      rating:           payload.rating,
      maxRating:        payload.maxRating,
      rank:             payload.rank,
      maxRank:          payload.maxRank,
      contribution:     payload.contribution,
      friendOfCount:    payload.friendOfCount,
      totalSolved:      payload.totalSolved,
      totalSubmissions: payload.totalSubmissions,
      contestsAttended: payload.contestsAttended,
      codeforcesScore:  codeforcesScore,
      ratingHistory:    payload.ratingHistory,
      ratingWiseSolved: payload.ratingWiseSolved,
      tagStats:         payload.tagStats,
      verdictStats:     payload.verdictStats,
      languageStats:    payload.languageStats,
      recentSubmissions: payload.recentSubmissions,
      lastSynced:       now,
      updatedAt:        now,
    },
    create: {
      userId:           user.id,
      handle:           payload.handle,
      avatar:           payload.avatar,
      firstName:        payload.firstName,
      lastName:         payload.lastName,
      country:          payload.country,
      city:             payload.city,
      organization:     payload.organization,
      rating:           payload.rating,
      maxRating:        payload.maxRating,
      rank:             payload.rank,
      maxRank:          payload.maxRank,
      contribution:     payload.contribution,
      friendOfCount:    payload.friendOfCount,
      totalSolved:      payload.totalSolved,
      totalSubmissions: payload.totalSubmissions,
      contestsAttended: payload.contestsAttended,
      codeforcesScore:  codeforcesScore,
      ratingHistory:    payload.ratingHistory,
      ratingWiseSolved: payload.ratingWiseSolved,
      tagStats:         payload.tagStats,
      verdictStats:     payload.verdictStats,
      languageStats:    payload.languageStats,
      recentSubmissions: payload.recentSubmissions,
      lastSynced:       now,
    },
  });

  // Recompute lucyScore
  const lc = await prisma.leetcodeStats.findUnique({
    where:  { userId: user.id },
    select: { leetcodeScore: true },
  });
  const lucyScore = calcLucyScore(lc?.leetcodeScore || 0, codeforcesScore);
  await prisma.user.update({ where: { id: user.id }, data: { lucyScore } });

  return { handle, rating: payload.rating, totalSolved: payload.totalSolved,
           ratingBuckets: payload.ratingWiseSolved.length, codeforcesScore, lucyScore };
}

async function main() {
  console.log('▶  rebuild-cf-stats starting…\n');

  const users = await prisma.user.findMany({
    where:  { codeforcesUsername: { not: null } },
    select: { id: true, name: true, codeforcesUsername: true },
  });

  if (users.length === 0) {
    console.log('No users with codeforcesUsername set — nothing to do.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${users.length} user(s) with Codeforces connected.\n`);

  const results = [];

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    console.log(`[${i + 1}/${users.length}] ${u.name} (@${u.codeforcesUsername})`);
    try {
      const result = await rebuildUser(u);
      results.push({ ...result, status: 'ok' });
      console.log(`     ✓  rating=${result.rating}  solved=${result.totalSolved}  buckets=${result.ratingBuckets}  cfScore=${result.codeforcesScore}  lucyScore=${result.lucyScore}`);
    } catch (err) {
      const msg = err.message || String(err);
      results.push({ handle: u.codeforcesUsername, status: 'error', error: msg });
      console.error(`     ✗  ${msg}`);
    }

    // Rate-limit gap between users (skip after last user)
    if (i < users.length - 1) await sleep(INTER_USER_DELAY_MS);
  }

  console.log('\n── Summary ─────────────────────────────────────');
  const ok  = results.filter((r) => r.status === 'ok').length;
  const err = results.filter((r) => r.status === 'error').length;
  console.log(`  ✓ Success: ${ok}    ✗ Errors: ${err}`);
  if (err > 0) {
    results.filter((r) => r.status === 'error').forEach((r) =>
      console.log(`    - ${r.handle}: ${r.error}`)
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
