import { redisClient, isRedisReady } from '../config/redis.js';
import prisma from '../config/prisma.js';
import {
  dashboardKey,
  dashboardLockKey,
  DASHBOARD_TTL,
  DASHBOARD_LOCK_TTL,
  lcDashboardKey,
  cfDashboardKey,
  PLATFORM_DASHBOARD_TTL,
} from '../utils/redisKeys.js';

// get the dashboard data for a user from redis
// with cache aside pattern with lock for stampede protection and fallback to postgres if redis is not available
export const getDashboard = async (userId) => {
  // 1. Try Redis cache
  if (isRedisReady()) {
    try {
      const cached = await redisClient.get(dashboardKey(userId));
      if (cached) {
        console.log("return data from redis of the user for dashboard.")
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('[Dashboard] Redis GET failed:', err.message);
    }

    // 2. Cache miss — attempt lock-protected rebuild
    try {
      return await rebuildWithLock(userId);
    } catch (err) {
      console.error('[Dashboard] Lock-protected rebuild failed:', err.message);
    }
  }

  // 3. Fallback — always works even without Redis
  return await buildDashboardDTO(userId);
};

// fetching the dashboard data from the db and returning it in the form of dto
export const buildDashboardDTO = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      college: true,
      department: true,
      leetcodeUsername: true,
      codeforcesUsername: true,
      lucyUsername: true,
      avatar: true,
      leetcodeStats: {
        select: {
          totalSolved: true,
          easy: true,
          medium: true,
          hard: true,
          contestRating: true,
          contestsAttended: true,
          globalRanking: true,
          topPercentage: true,
          streak: true,
          activeDays: true,
          universalScore: true,
          ratingHistory: true,
          submissionCalendar: true,
          lastSynced: true,
        },
      },
      // ── Codeforces stats (independent of LeetCode) ──────────────────────────
      // Null when the user has never synced Codeforces — callers must handle null.
      codeforcesStats: {
        select: {
          handle: true,
          avatar: true,
          firstName: true,
          lastName: true,
          country: true,
          organization: true,
          rating: true,
          maxRating: true,
          rank: true,
          maxRank: true,
          contribution: true,
          friendOfCount: true,
          totalSolved: true,
          totalSubmissions: true,
          contestsAttended: true,
          ratingHistory: true,
          ratingWiseSolved: true,
          tagStats: true,
          verdictStats: true,
          languageStats: true,
          recentSubmissions: true,
          lastSynced: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // ── LeetCode section (unchanged) ────────────────────────────────────────────
  const lcStats = user.leetcodeStats || {};

  // ── Codeforces section ───────────────────────────────────────────────────────
  // Returns null when never synced so frontend can render "not connected" state
  // without crashing the entire dashboard.
  const cfStats = user.codeforcesStats
    ? {
        handle:            user.codeforcesStats.handle,
        avatar:            user.codeforcesStats.avatar,
        firstName:         user.codeforcesStats.firstName,
        lastName:          user.codeforcesStats.lastName,
        country:           user.codeforcesStats.country,
        organization:      user.codeforcesStats.organization,
        rating:            user.codeforcesStats.rating            ?? 0,
        maxRating:         user.codeforcesStats.maxRating          ?? 0,
        rank:              user.codeforcesStats.rank,
        maxRank:           user.codeforcesStats.maxRank,
        contribution:      user.codeforcesStats.contribution       ?? 0,
        friendOfCount:     user.codeforcesStats.friendOfCount      ?? 0,
        totalSolved:       user.codeforcesStats.totalSolved         ?? 0,
        totalSubmissions:  user.codeforcesStats.totalSubmissions    ?? 0,
        contestsAttended:  user.codeforcesStats.contestsAttended    ?? 0,
        ratingHistory:     user.codeforcesStats.ratingHistory       ?? [],
        ratingWiseSolved:  user.codeforcesStats.ratingWiseSolved    ?? [],
        tagStats:          user.codeforcesStats.tagStats            ?? [],
        verdictStats:      user.codeforcesStats.verdictStats        ?? [],
        languageStats:     user.codeforcesStats.languageStats       ?? [],
        recentSubmissions: user.codeforcesStats.recentSubmissions   ?? [],
        lastSynced:        user.codeforcesStats.lastSynced          ?? null,
      }
    : null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      college: user.college,
      department: user.department,
      leetcodeUsername: user.leetcodeUsername,
      codeforcesUsername: user.codeforcesUsername,
      lucyUsername: user.lucyUsername,
      avatar: user.avatar,
    },
    // LeetCode stats — key name and structure completely unchanged
    stats: {
      totalSolved:      lcStats.totalSolved      || 0,
      easy:             lcStats.easy             || 0,
      medium:           lcStats.medium           || 0,
      hard:             lcStats.hard             || 0,
      contestRating:    lcStats.contestRating    || 0,
      contestsAttended: lcStats.contestsAttended || 0,
      globalRanking:    lcStats.globalRanking    || 0,
      topPercentage:    lcStats.topPercentage    || 0,
      streak:           lcStats.streak           || 0,
      activeDays:       lcStats.activeDays       || 0,
      universalScore:   lcStats.universalScore   || 0,
      ratingHistory:    lcStats.ratingHistory    || [],
      submissionCalendar: lcStats.submissionCalendar || {},
      lastSynced:       lcStats.lastSynced       || null,
    },
    // Codeforces stats — separate key, null when not connected/synced
    codeforces: cfStats,
  };
};

// storing the dashboard data in the redis
export const cacheDashboard = async (userId, dashboard) => {
  if (!isRedisReady()) return;

  try {
    await redisClient.set(
      dashboardKey(userId),
      JSON.stringify(dashboard),
      { EX: DASHBOARD_TTL }
    );
  } catch (err) {
    console.error('[Dashboard] Redis SET failed:', err.message);
  }
};

// deleting the dashboard key from redis
export const invalidateDashboardCache = async (userId) => {
  if (!isRedisReady()) return;

  try {
    await redisClient.del(dashboardKey(userId));
  } catch (err) {
    console.error('[Dashboard] Redis DEL failed:', err.message);
  }
};

// acquiring lock and rebuilding the dashboard from the db and caching in the redis
const rebuildWithLock = async (userId) => {
  const lockKey = dashboardLockKey(userId);

  // Try to acquire the lock (SET NX EX)
  const acquired = await redisClient.set(lockKey, '1', {
    NX: true,
    EX: DASHBOARD_LOCK_TTL,
  });

  if (acquired) {
    // We own the lock — rebuild the cache
    try {
      const dashboard = await buildDashboardDTO(userId);
      await cacheDashboard(userId, dashboard);
      return dashboard;
    } finally {
      // Release the lock
      try {
        await redisClient.del(lockKey);
      } catch {
        // Lock will auto-expire — safe to ignore
      }
    }
  }

  // Lock not acquired — another request is rebuilding.
  // Wait briefly and retry the cache a few times.
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(100);

    const cached = await redisClient.get(dashboardKey(userId));
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Still no cache after retries — fall back to PostgreSQL directly
  // (does NOT set cache to avoid thundering herd on the write side)
  return await buildDashboardDTO(userId);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Platform-specific dashboards ────────────────────────────────────────────
// Each function returns only the stats relevant to that platform.
// Returns a structured null section when the user hasn't connected/synced.

/**
 * LeetCode-only dashboard DTO.
 * Cached independently under platform:leetcode:dashboard:{userId}.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getLeetcodeDashboard = async (userId) => {
  if (isRedisReady()) {
    try {
      const cached = await redisClient.get(lcDashboardKey(userId));
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('[LC Dashboard] Redis GET failed:', err.message);
    }
  }

  const dto = await buildLeetcodeDashboardDTO(userId);

  if (isRedisReady()) {
    try {
      await redisClient.set(lcDashboardKey(userId), JSON.stringify(dto), { EX: PLATFORM_DASHBOARD_TTL });
    } catch (err) {
      console.error('[LC Dashboard] Redis SET failed:', err.message);
    }
  }

  return dto;
};

/**
 * Codeforces-only dashboard DTO.
 * Cached independently under platform:codeforces:dashboard:{userId}.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getCodeforcesDashboard = async (userId) => {
  if (isRedisReady()) {
    try {
      const cached = await redisClient.get(cfDashboardKey(userId));
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('[CF Dashboard] Redis GET failed:', err.message);
    }
  }

  const dto = await buildCodeforcesDashboardDTO(userId);

  if (isRedisReady()) {
    try {
      await redisClient.set(cfDashboardKey(userId), JSON.stringify(dto), { EX: PLATFORM_DASHBOARD_TTL });
    } catch (err) {
      console.error('[CF Dashboard] Redis SET failed:', err.message);
    }
  }

  return dto;
};

/** Build LeetCode-only DTO from DB — no CF data included. */
export const buildLeetcodeDashboardDTO = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true,
      leetcodeUsername: true, lucyUsername: true, avatar: true,
      leetcodeStats: {
        select: {
          leetcodeUsername: true, realName: true, avatar: true,
          totalSolved: true, easy: true, medium: true, hard: true,
          contestRating: true, contestsAttended: true,
          globalRanking: true, topPercentage: true,
          streak: true, activeDays: true,
          universalScore: true, leetcodeScore: true,
          ratingHistory: true, submissionCalendar: true,
          tags: true, lastSynced: true,
        },
      },
    },
  });

  if (!user) {
    const err = new Error('User not found'); err.statusCode = 404; throw err;
  }

  const lc = user.leetcodeStats;

  return {
    platform: 'leetcode',
    connected: !!user.leetcodeUsername,
    synced:    !!lc,
    user: {
      id: user.id, name: user.name, email: user.email,
      leetcodeUsername: user.leetcodeUsername,
      lucyUsername: user.lucyUsername, avatar: user.avatar,
    },
    stats: lc ? {
      leetcodeUsername:  lc.leetcodeUsername,
      realName:          lc.realName,
      avatar:            lc.avatar,
      totalSolved:       lc.totalSolved       || 0,
      easy:              lc.easy              || 0,
      medium:            lc.medium            || 0,
      hard:              lc.hard              || 0,
      contestRating:     lc.contestRating     || 0,
      contestsAttended:  lc.contestsAttended  || 0,
      globalRanking:     lc.globalRanking     || 0,
      topPercentage:     lc.topPercentage     || 0,
      streak:            lc.streak            || 0,
      activeDays:        lc.activeDays        || 0,
      universalScore:    lc.universalScore    || 0,
      leetcodeScore:     lc.leetcodeScore     || 0,
      ratingHistory:     lc.ratingHistory     || [],
      submissionCalendar: lc.submissionCalendar || {},
      tags:              lc.tags              || [],
      lastSynced:        lc.lastSynced        || null,
    } : null,
  };
};

/** Build Codeforces-only DTO from DB — no LeetCode data included. */
export const buildCodeforcesDashboardDTO = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true,
      codeforcesUsername: true, lucyUsername: true, avatar: true,
      codeforcesStats: {
        select: {
          handle: true, avatar: true,
          firstName: true, lastName: true,
          country: true, organization: true,
          rating: true, maxRating: true,
          rank: true, maxRank: true,
          contribution: true, friendOfCount: true,
          totalSolved: true, totalSubmissions: true,
          contestsAttended: true, codeforcesScore: true,
          ratingHistory: true, tagStats: true,
          ratingWiseSolved: true,
          verdictStats: true, languageStats: true,
          recentSubmissions: true, lastSynced: true,
        },
      },
    },
  });

  if (!user) {
    const err = new Error('User not found'); err.statusCode = 404; throw err;
  }

  const cf = user.codeforcesStats;

  return {
    platform: 'codeforces',
    connected: !!user.codeforcesUsername,
    synced:    !!cf,
    user: {
      id: user.id, name: user.name, email: user.email,
      codeforcesUsername: user.codeforcesUsername,
      lucyUsername: user.lucyUsername, avatar: user.avatar,
    },
    stats: cf ? {
      handle:            cf.handle,
      avatar:            cf.avatar,
      firstName:         cf.firstName,
      lastName:          cf.lastName,
      country:           cf.country,
      organization:      cf.organization,
      rating:            cf.rating           || 0,
      maxRating:         cf.maxRating         || 0,
      rank:              cf.rank,
      maxRank:           cf.maxRank,
      contribution:      cf.contribution      || 0,
      friendOfCount:     cf.friendOfCount     || 0,
      totalSolved:       cf.totalSolved        || 0,
      totalSubmissions:  cf.totalSubmissions   || 0,
      contestsAttended:  cf.contestsAttended   || 0,
      codeforcesScore:   cf.codeforcesScore    || 0,
      ratingHistory:     cf.ratingHistory      || [],
      ratingWiseSolved:  cf.ratingWiseSolved   || [],
      tagStats:          cf.tagStats           || [],
      verdictStats:      cf.verdictStats       || [],
      languageStats:     cf.languageStats      || [],
      recentSubmissions: cf.recentSubmissions  || [],
      lastSynced:        cf.lastSynced         || null,
    } : null,
  };
};

/**
 * Invalidate both platform dashboard caches for a user.
 * Call after any sync that touches either platform.
 *
 * @param {string} userId
 */
export const invalidatePlatformDashboardCaches = async (userId) => {
  if (!isRedisReady()) return;
  try {
    await redisClient.del([lcDashboardKey(userId), cfDashboardKey(userId)]);
  } catch (err) {
    console.error('[Platform Dashboard] Cache invalidation failed:', err.message);
  }
};
