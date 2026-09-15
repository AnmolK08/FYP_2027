import { redisClient, isRedisReady } from '../config/redis.js';
import prisma from '../config/prisma.js';
import { leaderboardKey, leaderboardTempKey } from '../utils/redisKeys.js';

export const LEADERBOARD_TYPES = /** @type {const} */ (['lucy', 'leetcode', 'codeforces']);

const assertType = (type) => {
  if (!LEADERBOARD_TYPES.includes(type)) {
    const err = new Error(`Invalid leaderboard type "${type}". Must be one of: ${LEADERBOARD_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
};


export const updatePlatformScores = async (userId, { leetcodeScore = 0, codeforcesScore = 0, lucyScore = 0 } = {}) => {
  if (!isRedisReady()) return;

  const ops = [
    { key: leaderboardKey('leetcode'),   score: leetcodeScore   },
    { key: leaderboardKey('codeforces'), score: codeforcesScore },
    { key: leaderboardKey('lucy'),       score: lucyScore       },
  ];

  await Promise.all(
    ops.map(({ key, score }) =>
      score > 0
        ? redisClient.zAdd(key, { score, value: userId }).catch((err) =>
            console.error(`[Leaderboard] ZADD ${key} failed:`, err.message)
          )
        : redisClient.zRem(key, userId).catch(() => {}) // silent — member may not exist
    )
  );
};


export const removeUser = async (userId) => {
  if (!isRedisReady()) return;
  try {
    await Promise.all(
      LEADERBOARD_TYPES.map((type) => redisClient.zRem(leaderboardKey(type), userId))
    );
  } catch (err) {
    console.error('[Leaderboard] ZREM (removeUser) failed:', err.message);
  }
};


export const updateUserScore = async (userId, score) => {
  if (!isRedisReady()) return;
  try {
    // Keep the old leaderboard:global key in sync for backward compat
    await redisClient.zAdd(leaderboardKey('global'), { score, value: userId });
    // Also update the lucy board so existing sync paths still feed the new board
    if (score > 0) {
      await redisClient.zAdd(leaderboardKey('lucy'), { score, value: userId });
    }
  } catch (err) {
    console.error('[Leaderboard] updateUserScore failed:', err.message);
  }
};


export const getLeaderboard = async (type = 'lucy', page = 1, limit = 20, requestingUserId = null) => {
  assertType(type);

  const start = (page - 1) * limit;
  const stop  = start + limit - 1;

  if (isRedisReady()) {
    try {
      let total = await redisClient.zCard(leaderboardKey(type));

      if (total === 0) {
        console.log(`[Leaderboard] ${type} ZSET empty — rebuilding from PostgreSQL…`);
        await rebuildLeaderboard(type);
        total = await redisClient.zCard(leaderboardKey(type));
      }

      const entries = await redisClient.zRangeWithScores(
        leaderboardKey(type),
        start,
        stop,
        { REV: true }
      );

      if (entries && entries.length > 0) {
        const userIds  = entries.map((e) => e.value);
        const profiles = await batchFetchProfiles(userIds, type);

        const users = entries.map((entry, idx) => {
          const p = profiles.get(entry.value) || {};
          return buildRow(entry.value, start + idx + 1, entry.score, p, type, requestingUserId);
        });

        return { users, page, limit, total, totalPages: Math.ceil(total / limit), type };
      }
    } catch (err) {
      console.error('[Leaderboard] Redis read failed, falling back to PostgreSQL:', err.message);
    }
  }

  return getLeaderboardFromDatabase(type, page, limit, requestingUserId);
};


export const getUserRank = async (type = 'lucy', userId) => {
  assertType(type);

  if (isRedisReady()) {
    try {
      let rank  = await redisClient.zRevRank(leaderboardKey(type), userId);
      let score = await redisClient.zScore(leaderboardKey(type), userId);

      if (rank === null || rank === undefined) {
        const total = await redisClient.zCard(leaderboardKey(type));
        if (total === 0) {
          await rebuildLeaderboard(type);
          rank  = await redisClient.zRevRank(leaderboardKey(type), userId);
          score = await redisClient.zScore(leaderboardKey(type), userId);
        }
      }

      if (rank !== null && rank !== undefined) {
        return { userId, rank: rank + 1, score: score || 0, type };
      }
    } catch (err) {
      console.error('[Leaderboard] getUserRank Redis failed:', err.message);
    }
  }

  return getUserRankFromDatabase(type, userId);
};


export const getNearbyUsers = async (type = 'lucy', userId, window = 2) => {
  assertType(type);

  // ── Redis path ────────────────────────────────────────────────────────────
  if (isRedisReady()) {
    try {
      const rank0 = await redisClient.zRevRank(leaderboardKey(type), userId); // 0-based

      if (rank0 !== null && rank0 !== undefined) {
        const start  = Math.max(0, rank0 - window);
        const stop   = rank0 + window;

        const entries = await redisClient.zRangeWithScores(
          leaderboardKey(type),
          start,
          stop,
          { REV: true }
        );

        if (entries && entries.length > 0) {
          const userIds  = entries.map((e) => e.value);
          const profiles = await batchFetchProfiles(userIds, type);

          const users = entries.map((entry, idx) => {
            const p = profiles.get(entry.value) || {};
            return buildRow(entry.value, start + idx + 1, entry.score, p, type, userId);
          });

          return { users, myRank: rank0 + 1, type };
        }
      }

      return { users: [], myRank: null, type };
    } catch (err) {
      console.error('[Leaderboard] getNearbyUsers Redis failed, falling back to DB:', err.message);
    }
  }

  // ── DB fallback ───────────────────────────────────────────────────────────
  return getNearbyUsersFromDatabase(type, userId, window);
};

// ─── Rebuild ──────────────────────────────────────────────────────────────────

// Per-type single-flight guards
const rebuildInFlight = {};

export const rebuildLeaderboard = async (type) => {
  if (type !== undefined) {
    assertType(type);
    return _rebuildOne(type);
  }
  // Rebuild all three in parallel
  const results = await Promise.all(LEADERBOARD_TYPES.map(_rebuildOne));
  return results.reduce((acc, r) => ({ ...acc, ...r }), {});
};

const _rebuildOne = async (type) => {
  if (rebuildInFlight[type]) return rebuildInFlight[type];

  rebuildInFlight[type] = (async () => {
    try {
      const entries = await _fetchScoresFromDB(type);

      if (entries.length === 0) {
        console.log(`[Leaderboard] No ${type} scores to rebuild from`);
        return { [type]: { rebuilt: 0 } };
      }

      if (!isRedisReady()) {
        console.warn(`[Leaderboard] Cannot rebuild ${type} — Redis unavailable`);
        return { [type]: { rebuilt: 0, error: 'Redis unavailable' } };
      }

      const tempKey   = `${leaderboardTempKey(type)}:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const targetKey = leaderboardKey(type);
      const BATCH     = 100;

      for (let i = 0; i < entries.length; i += BATCH) {
        await redisClient.zAdd(tempKey, entries.slice(i, i + BATCH));
      }

      await redisClient.rename(tempKey, targetKey);

      console.log(`[Leaderboard] Rebuilt ${type} with ${entries.length} users`);
      return { [type]: { rebuilt: entries.length } };
    } catch (err) {
      console.error(`[Leaderboard] Rebuild ${type} failed:`, err.message);
      throw err;
    } finally {
      rebuildInFlight[type] = null;
    }
  })();

  return rebuildInFlight[type];
};

/** Pull userId + score pairs from PostgreSQL for a given board type. */
const _fetchScoresFromDB = async (type) => {
  if (type === 'leetcode') {
    const rows = await prisma.leetcodeStats.findMany({
      where: { leetcodeScore: { gt: 0 } },
      select: { userId: true, leetcodeScore: true },
    });
    return rows.map((r) => ({ score: r.leetcodeScore, value: r.userId }));
  }

  if (type === 'codeforces') {
    const rows = await prisma.codeforcesStats.findMany({
      where: { codeforcesScore: { gt: 0 } },
      select: { userId: true, codeforcesScore: true },
    });
    return rows.map((r) => ({ score: r.codeforcesScore, value: r.userId }));
  }

  // lucy
  const rows = await prisma.user.findMany({
    where: { lucyScore: { gt: 0 } },
    select: { id: true, lucyScore: true },
  });
  return rows.map((r) => ({ score: r.lucyScore, value: r.id }));
};

// ─── DB fallbacks ─────────────────────────────────────────────────────────────

const getLeaderboardFromDatabase = async (type, page, limit, requestingUserId) => {
  const skip = (page - 1) * limit;

  if (type === 'leetcode') {
    const [entries, total] = await Promise.all([
      prisma.leetcodeStats.findMany({
        where: { leetcodeScore: { gt: 0 } },
        orderBy: { leetcodeScore: 'desc' },
        skip, take: limit,
        select: {
          userId: true, leetcodeScore: true,
          totalSolved: true, easy: true, medium: true, hard: true,
          contestRating: true,
          user: { select: { name: true, avatar: true, college: true, department: true, leetcodeUsername: true, lucyUsername: true } },
        },
      }),
      prisma.leetcodeStats.count({ where: { leetcodeScore: { gt: 0 } } }),
    ]);
    const users = entries.map((e, i) => buildRow(
      e.userId, skip + i + 1, e.leetcodeScore,
      { ...e.user, leetcodeStats: { totalSolved: e.totalSolved, easy: e.easy, medium: e.medium, hard: e.hard, contestRating: e.contestRating } },
      type, requestingUserId
    ));
    return { users, page, limit, total, totalPages: Math.ceil(total / limit), type };
  }

  if (type === 'codeforces') {
    const [entries, total] = await Promise.all([
      prisma.codeforcesStats.findMany({
        where: { codeforcesScore: { gt: 0 } },
        orderBy: { codeforcesScore: 'desc' },
        skip, take: limit,
        select: {
          userId: true, codeforcesScore: true,
          totalSolved: true, rating: true, contestsAttended: true, handle: true,
          user: { select: { name: true, avatar: true, college: true, department: true, codeforcesUsername: true, lucyUsername: true } },
        },
      }),
      prisma.codeforcesStats.count({ where: { codeforcesScore: { gt: 0 } } }),
    ]);
    const users = entries.map((e, i) => buildRow(
      e.userId, skip + i + 1, e.codeforcesScore,
      { ...e.user, codeforcesStats: { totalSolved: e.totalSolved, rating: e.rating, contestsAttended: e.contestsAttended, handle: e.handle } },
      type, requestingUserId
    ));
    return { users, page, limit, total, totalPages: Math.ceil(total / limit), type };
  }

  // ── lucy — strictly lucyScore, no universalScore fallback ─────────────────
  const [entries, total] = await Promise.all([
    prisma.user.findMany({
      where: { lucyScore: { gt: 0 } },
      orderBy: { lucyScore: 'desc' },
      skip, take: limit,
      select: {
        id: true, name: true, avatar: true, college: true, department: true,
        lucyUsername: true, leetcodeUsername: true, codeforcesUsername: true, lucyScore: true,
        leetcodeStats: {
          select: { totalSolved: true, easy: true, medium: true, hard: true, contestRating: true, leetcodeScore: true },
        },
        codeforcesStats: {
          select: { totalSolved: true, rating: true, codeforcesScore: true, handle: true },
        },
      },
    }),
    prisma.user.count({ where: { lucyScore: { gt: 0 } } }),
  ]);

  const users = entries.map((e, i) =>
    buildRow(e.id, skip + i + 1, e.lucyScore, e, type, requestingUserId)
  );
  return { users, page, limit, total, totalPages: Math.ceil(total / limit), type };
};

const getUserRankFromDatabase = async (type, userId) => {
  if (type === 'leetcode') {
    const s = await prisma.leetcodeStats.findUnique({ where: { userId }, select: { leetcodeScore: true } });
    if (!s) return { userId, rank: null, score: 0, type };
    const above = await prisma.leetcodeStats.count({ where: { leetcodeScore: { gt: s.leetcodeScore } } });
    return { userId, rank: above + 1, score: s.leetcodeScore, type };
  }
  if (type === 'codeforces') {
    const s = await prisma.codeforcesStats.findUnique({ where: { userId }, select: { codeforcesScore: true } });
    if (!s) return { userId, rank: null, score: 0, type };
    const above = await prisma.codeforcesStats.count({ where: { codeforcesScore: { gt: s.codeforcesScore } } });
    return { userId, rank: above + 1, score: s.codeforcesScore, type };
  }
  // lucy — strictly lucyScore
  const s = await prisma.user.findUnique({ where: { id: userId }, select: { lucyScore: true } });
  if (!s || !s.lucyScore) return { userId, rank: null, score: 0, type };
  const above = await prisma.user.count({ where: { lucyScore: { gt: s.lucyScore } } });
  return { userId, rank: above + 1, score: s.lucyScore, type };
};


const getNearbyUsersFromDatabase = async (type, userId, window = 2) => {
  const myRankData = await getUserRankFromDatabase(type, userId);
  if (!myRankData.rank) return { users: [], myRank: null, type };

  const myRank = myRankData.rank;
  const skip   = Math.max(0, myRank - window - 1);
  const take   = window * 2 + 1;

  const result = await getLeaderboardFromDatabase(type, 1, skip + take, userId);
  const windowRows = result.users.slice(skip);

  return { users: windowRows, myRank, type };
};

const batchFetchProfiles = async (userIds, type) => {
  if (!userIds.length) return new Map();

  const baseSelect = {
    id: true, name: true, avatar: true, college: true, department: true,
    lucyUsername: true, leetcodeUsername: true, codeforcesUsername: true,
  };

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      ...baseSelect,
      lucyScore: true,
      leetcodeStats: type === 'codeforces' ? false : {
        select: { totalSolved: true, easy: true, medium: true, hard: true, contestRating: true, leetcodeScore: true },
      },
      codeforcesStats: type === 'leetcode' ? false : {
        select: { totalSolved: true, rating: true, contestsAttended: true, codeforcesScore: true, handle: true },
      },
    },
  });

  return new Map(users.map((u) => [u.id, u]));
};

// ─── Row builder ──────────────────────────────────────────────────────────────

/** Build a normalised leaderboard row regardless of source (Redis or DB). */
const buildRow = (userId, rank, score, profile, type, requestingUserId) => {
  const lc = profile.leetcodeStats  || {};
  const cf = profile.codeforcesStats || {};

  const base = {
    rank,
    userId,
    name:               profile.name       || 'Unknown',
    avatar:             profile.avatar
                          || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'U'}`,
    college:            profile.college    || null,
    department:         profile.department || null,
    lucyUsername:       profile.lucyUsername       || null,
    leetcodeUsername:   profile.leetcodeUsername   || null,
    codeforcesUsername: profile.codeforcesUsername || cf.handle || null,
    score:              score || 0,
    is_me:              userId === requestingUserId,
  };

  if (type === 'leetcode') {
    return {
      ...base,
      totalSolved:    lc.totalSolved   || 0,
      easy:           lc.easy          || 0,
      medium:         lc.medium        || 0,
      hard:           lc.hard          || 0,
      contestRating:  lc.contestRating || 0,
      leetcodeScore:  lc.leetcodeScore || score,
    };
  }

  if (type === 'codeforces') {
    return {
      ...base,
      cfHandle:          cf.handle            || null,
      totalSolved:       cf.totalSolved        || 0,
      cfRating:          cf.rating             || 0,
      contestsAttended:  cf.contestsAttended   || 0,
      codeforcesScore:   cf.codeforcesScore    || score,
    };
  }

  // lucy — show both platform numbers
  return {
    ...base,
    lucyScore:         score,
    // LeetCode side
    lcTotalSolved:     lc.totalSolved   || 0,
    lcEasy:            lc.easy          || 0,
    lcMedium:          lc.medium        || 0,
    lcHard:            lc.hard          || 0,
    lcContestRating:   lc.contestRating || 0,
    leetcodeScore:     lc.leetcodeScore || profile.leetcodeStats?.leetcodeScore || 0,
    // Codeforces side
    cfHandle:          cf.handle           || null,
    cfTotalSolved:     cf.totalSolved       || 0,
    cfRating:          cf.rating            || 0,
    codeforcesScore:   cf.codeforcesScore   || profile.codeforcesStats?.codeforcesScore || 0,
  };
};
