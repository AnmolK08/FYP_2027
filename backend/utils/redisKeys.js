//Redis Key Helpers

/* Key inventory:
 *   user:{userId}:dashboard          – cached dashboard JSON (TTL 5 min)
 *   user:{userId}:profile            – cached profile for leaderboard enrichment
 *   lock:user:{userId}:dashboard     – stampede lock for dashboard rebuild
 *   lock:leetcode:sync:{userId}      – dedup lock for LeetCode sync jobs
 *   leaderboard:global               – global sorted set
 *   leaderboard:{type}:{identifier}  – extensible pattern for future leaderboards
 */

//  dashboard redis key
export const dashboardKey = (userId) => `user:${userId}:dashboard`;

// dashboard lock redis key
export const dashboardLockKey = (userId) => `lock:user:${userId}:dashboard`;

//  dashboard ttl in seconds (5 minutes).
export const DASHBOARD_TTL = 300;

// dashboard stampede lock TTL in seconds.
export const DASHBOARD_LOCK_TTL = 10;

// profile redis key
export const profileKey = (userId) => `user:${userId}:profile`;

export const PROFILE_TTL = 600;

/**
 * Generate a leaderboard key.
 * @param {'global'|'weekly'|'monthly'|'college'} type
 * @param {string|null} identifier – e.g. college name for scoped boards
 * @returns {string}
 */


// leaderboard redis key
export const leaderboardKey = (type = 'global', identifier = null) => {
  if (identifier) return `leaderboard:${type}:${identifier}`;
  return `leaderboard:${type}`;
};

// Temporary key used during leaderboard rebuilds.
export const leaderboardTempKey = (type = 'global', identifier = null) => {
  const base = leaderboardKey(type, identifier);
  return `${base}:rebuild_tmp`;
};

// sync lock redis 
export const syncLockKey = (userId) => `lock:leetcode:sync:${userId}`;

export const SYNC_LOCK_TTL = 120;
