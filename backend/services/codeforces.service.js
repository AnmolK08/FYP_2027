import prisma from '../config/prisma.js';
import { redisClient, isRedisReady } from '../config/redis.js';
import { invalidateDashboardCache } from './dashboard.service.js';
import { updatePlatformScores } from './leaderboard.service.js';
import { fetchUserInfo, fetchUserStatus, fetchUserRating } from '../utils/codeforces.provider.js';
import { buildCodeforcesPayload } from '../utils/codeforces.mapper.js';
import { calcCodeforcesScore, calcLucyScore } from '../utils/scoring.js';
import {
  cfSyncLockKey,
  CF_SYNC_LOCK_TTL,
  cfStatsKey,
  CF_STATS_TTL,
} from '../utils/redisKeys.js';


export const syncCodeforcesStats = async (userId) => {
  // 1. Resolve handle from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { codeforcesUsername: true },
  });

  if (!user || !user.codeforcesUsername) {
    const error = new Error('Codeforces username not set in profile');
    error.statusCode = 400;
    throw error;
  }

  const handle = user.codeforcesUsername.trim();

  // 2. Acquire per-user sync lock (prevents concurrent duplicate syncs)
  if (isRedisReady()) {
    try {
      const lockAcquired = await redisClient.set(
        cfSyncLockKey(userId),
        '1',
        { NX: true, EX: CF_SYNC_LOCK_TTL }
      );
      if (!lockAcquired) {
        const error = new Error('A Codeforces sync is already in progress for your account');
        error.statusCode = 409;
        throw error;
      }
    } catch (err) {
      // Re-throw 409 as-is; ignore other Redis errors and continue without lock
      if (err.statusCode === 409) throw err;
      console.error('[CF Sync] Lock acquisition failed:', err.message);
    }
  }

  try {
    // 3. Fetch from Codeforces — three calls made SEQUENTIALLY to avoid
    //    rate-limiting (CF enforces ~1 req/2s per IP on user.status).
    const cfUser = await fetchUserInfo(handle);
    const submissions = await fetchUserStatus(handle);
    const ratingChanges = await fetchUserRating(handle);

    // 4. Map raw data → internal payload
    const payload = buildCodeforcesPayload(cfUser, submissions, ratingChanges);

    // 5. Compute codeforcesScore using the centralised scoring formula
    const codeforcesScore = calcCodeforcesScore({
      ratingWiseSolved: payload.ratingWiseSolved,
      rating: payload.rating,
    });
    payload.codeforcesScore = codeforcesScore;

    // 6. Persist to DB
    const stats = await persistCodeforcesData(userId, payload);

    // 7. Recompute lucyScore = leetcodeScore (current) + codeforcesScore
    const lcStats = await prisma.leetcodeStats.findUnique({ where: { userId }, select: { leetcodeScore: true } });
    const lcScore = lcStats?.leetcodeScore || 0;
    const lucyScore = calcLucyScore(lcScore, codeforcesScore);

    // Persist lucyScore on the User row
    await prisma.user.update({
      where: { id: userId },
      data: { lucyScore },
    });

    // 8. Update caches AFTER DB succeeds
    await postSyncRedisUpdates(userId, stats, codeforcesScore, lcScore, lucyScore);

    return stats;
  } finally {
    // Always release sync lock, even on error
    if (isRedisReady()) {
      try {
        await redisClient.del(cfSyncLockKey(userId));
      } catch {
        // Lock auto-expires — safe to ignore
      }
    }
  }
};


export const persistCodeforcesData = async (userId, payload) => {
  const now = new Date();

  const stats = await prisma.codeforcesStats.upsert({
    where: { userId },
    update: {
      handle: payload.handle,
      avatar: payload.avatar,
      firstName: payload.firstName,
      lastName: payload.lastName,
      country: payload.country,
      city: payload.city,
      organization: payload.organization,

      rating: payload.rating,
      maxRating: payload.maxRating,
      rank: payload.rank,
      maxRank: payload.maxRank,

      contribution: payload.contribution,
      friendOfCount: payload.friendOfCount,

      totalSolved: payload.totalSolved,
      totalSubmissions: payload.totalSubmissions,
      contestsAttended: payload.contestsAttended,
      codeforcesScore: payload.codeforcesScore ?? 0,

      ratingHistory: payload.ratingHistory,
      ratingWiseSolved: payload.ratingWiseSolved,
      tagStats: payload.tagStats,
      verdictStats: payload.verdictStats,
      languageStats: payload.languageStats,
      recentSubmissions: payload.recentSubmissions,

      lastSynced: now,
      updatedAt: now,
    },
    create: {
      userId,
      handle: payload.handle,
      avatar: payload.avatar,
      firstName: payload.firstName,
      lastName: payload.lastName,
      country: payload.country,
      city: payload.city,
      organization: payload.organization,

      rating: payload.rating,
      maxRating: payload.maxRating,
      rank: payload.rank,
      maxRank: payload.maxRank,

      contribution: payload.contribution,
      friendOfCount: payload.friendOfCount,

      totalSolved: payload.totalSolved,
      totalSubmissions: payload.totalSubmissions,
      contestsAttended: payload.contestsAttended,
      codeforcesScore: payload.codeforcesScore ?? 0,

      ratingHistory: payload.ratingHistory,
      ratingWiseSolved: payload.ratingWiseSolved,
      tagStats: payload.tagStats,
      verdictStats: payload.verdictStats,
      languageStats: payload.languageStats,
      recentSubmissions: payload.recentSubmissions,

      lastSynced: now,
    },
  });

  return stats;
};


export const postSyncRedisUpdates = async (userId, stats, codeforcesScore = 0, leetcodeScore = 0, lucyScore = 0) => {
  // 1. Invalidate dashboard so the next getDashboard() rebuilds with fresh CF data
  try {
    await invalidateDashboardCache(userId);
  } catch (err) {
    console.error('[CF Sync] Dashboard cache invalidation failed:', err.message);
  }

  // 2. Cache the CF stats blob for fast getStats() reads
  if (isRedisReady()) {
    try {
      await redisClient.set(cfStatsKey(userId), JSON.stringify(stats), {
        EX: CF_STATS_TTL,
      });
    } catch (err) {
      console.error('[CF Sync] CF stats cache write failed:', err.message);
    }
  }

  // 3. Update all three platform leaderboard ZSETs
  try {
    await updatePlatformScores(userId, { leetcodeScore, codeforcesScore, lucyScore });
  } catch (err) {
    console.error('[CF Sync] Platform leaderboard update failed:', err.message);
  }
};


export const getCodeforcesStats = async (userId) => {
  // 1. Try Redis cache
  if (isRedisReady()) {
    try {
      const cached = await redisClient.get(cfStatsKey(userId));
      if (cached) {
        console.log('[CF] Cache HIT for userId:', userId);
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('[CF] Redis GET failed:', err.message);
    }
  }

  // 2. Fallback to DB
  const stats = await prisma.codeforcesStats.findUnique({
    where: { userId },
  });

  // Populate cache on read-miss so subsequent calls are fast
  if (stats && isRedisReady()) {
    try {
      await redisClient.set(cfStatsKey(userId), JSON.stringify(stats), {
        EX: CF_STATS_TTL,
      });
    } catch (err) {
      console.error('[CF] Redis SET on read-miss failed:', err.message);
    }
  }

  return stats || null;
};


export const invalidateCFCache = async (userId) => {
  if (!isRedisReady()) return;
  try {
    await redisClient.del(cfStatsKey(userId));
  } catch (err) {
    console.error('[CF] Cache invalidation failed:', err.message);
  }
};
