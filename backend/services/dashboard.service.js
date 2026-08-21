import { redisClient, isRedisReady } from '../config/redis.js';
import prisma from '../config/prisma.js';
import {
  dashboardKey,
  dashboardLockKey,
  DASHBOARD_TTL,
  DASHBOARD_LOCK_TTL,
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
          lastSynced: true,
        },
      },
      activities: {
        orderBy: { date: 'desc' },
        take: 30,
        select: {
          date: true,
          checkedIn: true,
          synced: true,
          solvedSnapshot: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const stats = user.leetcodeStats || {};

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      college: user.college,
      department: user.department,
      leetcodeUsername: user.leetcodeUsername,
      avatar: user.avatar,
    },
    stats: {
      totalSolved: stats.totalSolved || 0,
      easy: stats.easy || 0,
      medium: stats.medium || 0,
      hard: stats.hard || 0,
      contestRating: stats.contestRating || 0,
      contestsAttended: stats.contestsAttended || 0,
      globalRanking: stats.globalRanking || 0,
      topPercentage: stats.topPercentage || 0,
      streak: stats.streak || 0,
      activeDays: stats.activeDays || 0,
      universalScore: stats.universalScore || 0,
      lastSynced: stats.lastSynced || null,
    },
    activity: user.activities,
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
