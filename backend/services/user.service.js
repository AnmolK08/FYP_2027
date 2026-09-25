import prisma from '../config/prisma.js';
import { getDashboard, invalidateDashboardCache } from './dashboard.service.js';
import { removeUser as removeUserFromLeaderboard } from './leaderboard.service.js';
import { validateLucyUsername } from '../utils/usernameValidation.js';
import { redisClient, isRedisReady } from '../config/redis.js';
import { lucyUsernameKey, LUCY_USERNAME_TTL } from '../utils/redisKeys.js';
import { invalidateCFCache } from '../services/codeforces.service.js';


export const findAllUsers = async () => {
  return await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
  });
};

export const findUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const createUser = async (userData) => {
  // Logic usually overlaps with authService.registerUser
  // Kept here for structure completion
  return await prisma.user.create({
    data: userData,
  });
};

export const updateUser = async (id, updateData) => {
  const { name, college, department, leetcodeUsername, codeforcesUsername, dailyGoal } = updateData;

  // Check if the CF handle is actually changing before invalidating the cache
  const currentUser = await prisma.user.findUnique({
    where: { id },
    select: { codeforcesUsername: true },
  });

  const cfHandleChanged =
    codeforcesUsername !== undefined &&
    codeforcesUsername !== (currentUser?.codeforcesUsername ?? null);

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: name || undefined,
      college: college !== undefined ? college : undefined,
      department: department !== undefined ? department : undefined,
      leetcodeUsername: leetcodeUsername !== undefined ? leetcodeUsername : undefined,
      codeforcesUsername: codeforcesUsername !== undefined ? codeforcesUsername : undefined,
      dailyGoal: dailyGoal !== undefined ? dailyGoal : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      college: true,
      department: true,
      leetcodeUsername: true,
      codeforcesUsername: true,
      lucyUsername: true,
      avatar: true,
      dailyGoal: true,
      updatedAt: true,
    },
  });

  await invalidateDashboardCache(id);

  // Invalidate the CF stats cache when the handle changes so getCodeforcesStats()
  // doesn't return stale data for the old handle
  if (cfHandleChanged) {
    await invalidateCFCache(id);
  }

  return user;
};

export const deleteUser = async (id) => {
  await findUserById(id);

  const result = await prisma.user.delete({
    where: { id },
  });

  await invalidateDashboardCache(id);
  await removeUserFromLeaderboard(id);

  return result;
};

export const updateLucyUsername = async (userId, newUsername) => {
  if (!newUsername || typeof newUsername !== 'string') {
    const error = new Error('Username is required');
    error.statusCode = 400;
    throw error;
  }

  const clean = newUsername.trim().toLowerCase();

  const validation = validateLucyUsername(clean);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.user.findFirst({
    where: {
      lucyUsername: clean,
      NOT: { id: userId },
    },
    select: { id: true },
  });

  if (existing) {
    const error = new Error(`Username '${clean}' is already taken`);
    error.statusCode = 409;
    throw error;
  }

  // Need the old username to invalidate its Redis mapping
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { lucyUsername: true },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { lucyUsername: clean },
    select: {
      id: true,
      email: true,
      name: true,
      college: true,
      department: true,
      leetcodeUsername: true,
      lucyUsername: true,
      avatar: true,
      dailyGoal: true,
      updatedAt: true,
    },
  });

  // Invalidate both the old and new username mappings so stale lookups
  // can't resolve to the wrong user
  if (isRedisReady()) {
    try {
      const keysToDelete = [lucyUsernameKey(clean)];
      if (currentUser?.lucyUsername && currentUser.lucyUsername !== clean) {
        keysToDelete.push(lucyUsernameKey(currentUser.lucyUsername));
      }
      await redisClient.del(keysToDelete);
    } catch (err) {
      console.error('[User] Redis DEL for lucyUsername mapping failed:', err.message);
    }
  }
  await invalidateDashboardCache(userId);

  return updatedUser;
};

export const getPublicProfileByUsername = async (username) => {
  if (!username) {
    const error = new Error('Username parameter is required');
    error.statusCode = 400;
    throw error;
  }

  const cleanUsername = String(username).trim().toLowerCase();
  let userId = null;

  // Cache the lucyUsername → userId mapping so profile views don't need a DB read
  if (isRedisReady()) {
    try {
      const cachedUserId = await redisClient.get(lucyUsernameKey(cleanUsername));
      if (cachedUserId) {
        userId = cachedUserId;
      }
    } catch (err) {
      console.error('[Profile] Redis GET for lucyUsername failed:', err.message);
    }
  }

  if (!userId) {
    const user = await prisma.user.findFirst({
      where: {
        lucyUsername: { equals: cleanUsername, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (!user) {
      const error = new Error(`User '${username}' not found`);
      error.statusCode = 404;
      throw error;
    }

    userId = user.id;

    if (isRedisReady()) {
      try {
        await redisClient.set(lucyUsernameKey(cleanUsername), userId, {
          EX: LUCY_USERNAME_TTL,
        });
      } catch (err) {
        console.error('[Profile] Redis SET for lucyUsername failed:', err.message);
      }
    }
  }

  // getDashboard is itself Redis-cached, so public profile views are fast
  const dashboardData = await getDashboard(userId);

  const maskEmail = (email) => {
    if (!email) return null;
    const [name, domain] = email.split('@');
    if (!domain) return '***';
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  };

  return {
    user: {
      ...dashboardData.user,
      email: maskEmail(dashboardData.user?.email),
      password: undefined, // never expose password hash on public profile
    },
    stats: dashboardData.stats,
    codeforces: dashboardData.codeforces ?? null,
  };
};
