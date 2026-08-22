import { redisClient, isRedisReady } from '../config/redis.js';
import prisma from '../config/prisma.js';
import {
  leaderboardKey,
  leaderboardTempKey,
} from '../utils/redisKeys.js';


// Uses Redis Sorted Sets (ZSET) for O(log N) ranking operations.
//The ZSET member is the userId; the score is universalScore.

// Redis is NOT the source of truth — the leaderboard can always be
// rebuilt from PostgreSQL via rebuildLeaderboard().


// updating the leaderboard score if the user have sync it profile
export const updateUserScore = async (userId, score) => {
  if (!isRedisReady()) return;

  try {
    await redisClient.zAdd(leaderboardKey(), {
      score,
      value: userId,
    });
  } catch (err) {
    console.error('[Leaderboard] ZADD failed:', err.message);
  }
};


// Remove a user from the leaderboard if the user have delete it profile
export const removeUser = async (userId) => {
  if (!isRedisReady()) return;

  try {
    await redisClient.zRem(leaderboardKey(), userId);
  } catch (err) {
    console.error('[Leaderboard] ZREM failed:', err.message);
  }
};

// fetching the leaderboard for user 
export const getLeaderboard = async (page = 1, limit = 20, requestingUserId = null) => {
  const start = (page - 1) * limit;
  const stop = start + limit - 1;

  // 1- fetching from Redis first
  if (isRedisReady()) {
    try {
      const total = await redisClient.zCard(leaderboardKey());

      if (total === 0) {
        console.log('[Leaderboard] ZSET is empty, triggering background rebuild...');
        rebuildLeaderboard().catch(err => console.error('[Leaderboard] Background rebuild failed:', err.message));
        // Fall through to DB fallback for this immediate request
      } else {
        // ZREVRANGE with scores — returns [{value, score}, ...]
        const entries = await redisClient.zRangeWithScores(
          leaderboardKey(),
          start,
          stop,
          { REV: true }
        );

        if (entries && entries.length > 0) {
          const userIds = entries.map((e) => e.value);
          const profiles = await batchFetchProfiles(userIds);

          const users = entries.map((entry, index) => {
            const profile = profiles.get(entry.value) || {};
            return {
              rank: start + index + 1,
              userId: entry.value,
              name: profile.name || 'Unknown',
              avatar: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'U'}`,
              college: profile.college || null,
              department: profile.department || null,
              leetcodeUsername: profile.leetcodeUsername || null,
              totalSolved: profile.leetcodeStats?.totalSolved || 0,
              easy: profile.leetcodeStats?.easy || 0,
              medium: profile.leetcodeStats?.medium || 0,
              hard: profile.leetcodeStats?.hard || 0,
              contestRating: profile.leetcodeStats?.contestRating || 0,
              universalScore: entry.score,
              is_me: entry.value === requestingUserId,
            };
          });

          // Get total count for pagination metadata
          const total = await redisClient.zCard(leaderboardKey());
          console.log("return leaderboard data from redis")

          return {
            users,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          };
        }
      }
    } catch (err) {
      console.error('[Leaderboard] Redis read failed, falling back to PostgreSQL:', err.message);
    }
  }

  // Fallback to db for direct query
  return await getLeaderboardFromDatabase(page, limit, requestingUserId);
};

// fetching the user rank and score from redis
export const getUserRank = async (userId) => {
  if (isRedisReady()) {
    try {
      // ZREVRANK is 0-based
      const rank = await redisClient.zRevRank(leaderboardKey(), userId);
      const score = await redisClient.zScore(leaderboardKey(), userId);

      if (rank !== null && rank !== undefined) {
        return {
          userId,
          rank: rank + 1, // Convert to 1-based
          universalScore: score || 0,
        };
      }
    } catch (err) {
      console.error('[Leaderboard] getUserRank Redis failed:', err.message);
    }
  }

  // Fallback query from db
  return await getUserRankFromDatabase(userId);
};

// rebuild the entire global leaderboard from PostgreSQL.
// Uses a temp key + RENAME for atomic replacement so reads aren't
// interrupted during the rebuild.
export const rebuildLeaderboard = async () => {
  const stats = await prisma.leetcodeStats.findMany({
    where: { universalScore: { gt: 0 } },
    select: {
      userId: true,
      universalScore: true,
    },
  });

  if (stats.length === 0) {
    console.log('[Leaderboard] No stats to rebuild from');
    return { rebuilt: 0 };
  }

  if (!isRedisReady()) {
    console.warn('[Leaderboard] Cannot rebuild — Redis is unavailable');
    return { rebuilt: 0, error: 'Redis unavailable' };
  }

  const tempKey = leaderboardTempKey();
  const targetKey = leaderboardKey();

  try {
    // Delete any stale temp key
    await redisClient.del(tempKey);

    // Batch ZADD into the temp key (100 at a time)
    const BATCH_SIZE = 100;
    for (let i = 0; i < stats.length; i += BATCH_SIZE) {
      const batch = stats.slice(i, i + BATCH_SIZE).map((s) => ({
        score: s.universalScore,
        value: s.userId,
      }));
      await redisClient.zAdd(tempKey, batch);
    }

    // Atomic swap: RENAME temp → target
    await redisClient.rename(tempKey, targetKey);

    console.log(`[Leaderboard] Rebuilt with ${stats.length} users`);
    return { rebuilt: stats.length };
  } catch (err) {
    console.error('[Leaderboard] Rebuild failed:', err.message);
    // Clean up temp key on failure
    try {
      await redisClient.del(tempKey);
    } catch { /* ignore */ }
    throw err;
  }
};

// Batch fetch user profiles from PostgreSQL
// This function is used to fetch the user profiles from the database in a batch 
// this is done to avoid the N+1 problem 
const batchFetchProfiles = async (userIds) => {
  if (userIds.length === 0) return new Map();

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      avatar: true,
      college: true,
      department: true,
      leetcodeUsername: true,
      leetcodeStats: {
        select: {
          totalSolved: true,
          easy: true,
          medium: true,
          hard: true,
          contestRating: true,
        },
      },
    },
  });

  const map = new Map();
  for (const u of users) {
    map.set(u.id, u);
  }
  return map;
};

// PostgreSQL fallback for leaderboard reads.
// Used when Redis is unavailable — NOT for normal traffic.
const getLeaderboardFromDatabase = async (page, limit, requestingUserId) => {
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.leetcodeStats.findMany({
      where: { universalScore: { gt: 0 } },
      orderBy: { universalScore: 'desc' },
      skip,
      take: limit,
      select: {
        userId: true,
        universalScore: true,
        user: {
          select: {
            name: true,
            avatar: true,
            college: true,
            department: true,
            leetcodeUsername: true,
            leetcodeStats: {
              select: {
                totalSolved: true,
                easy: true,
                medium: true,
                hard: true,
                contestRating: true,
              },
            },
          },
        },
      },
    }),
    prisma.leetcodeStats.count({
      where: { universalScore: { gt: 0 } },
    }),
  ]);

  const users = entries.map((entry, index) => ({
    rank: skip + index + 1,
    userId: entry.userId,
    name: entry.user?.name || 'Unknown',
    avatar: entry.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.user?.name || 'U'}`,
    college: entry.user?.college || null,
    department: entry.user?.department || null,
    leetcodeUsername: entry.user?.leetcodeUsername || null,
    totalSolved: entry.user?.leetcodeStats?.totalSolved || 0,
    easy: entry.user?.leetcodeStats?.easy || 0,
    medium: entry.user?.leetcodeStats?.medium || 0,
    hard: entry.user?.leetcodeStats?.hard || 0,
    contestRating: entry.user?.leetcodeStats?.contestRating || 0,
    universalScore: entry.universalScore,
    is_me: entry.userId === requestingUserId,
  }));

  return {
    users,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

// PostgreSQL fallback for user rank lookup.
const getUserRankFromDatabase = async (userId) => {
  const userStats = await prisma.leetcodeStats.findUnique({
    where: { userId },
    select: { universalScore: true },
  });

  if (!userStats) {
    return { userId, rank: null, universalScore: 0 };
  }

  // Count how many users have a higher score
  const usersAbove = await prisma.leetcodeStats.count({
    where: { universalScore: { gt: userStats.universalScore } },
  });

  return {
    userId,
    rank: usersAbove + 1,
    universalScore: userStats.universalScore,
  };
};
