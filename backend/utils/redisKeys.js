//Redis Key Helpers

/* Key inventory:
 *   user:{userId}:dashboard              – cached dashboard JSON (TTL 5 min)
 *   user:{userId}:profile                – cached profile for leaderboard enrichment
 *   lock:user:{userId}:dashboard         – stampede lock for dashboard rebuild
 *   lock:leetcode:sync:{userId}          – dedup lock for LeetCode sync jobs
 *   lock:codeforces:sync:{userId}        – dedup lock for Codeforces sync jobs
 *   leaderboard:global                   – global sorted set (LeetCode universalScore)
 *   leaderboard:{type}:{identifier}      – extensible pattern for future leaderboards
 *   lucy:username:{lucyUsername}         – lucyUsername → userId mapping (TTL 10 min)
 *
 * Provider-namespaced patterns (scalable — add CodeChef/GFG/Github by copy-paste):
 *   leetcode:profile:{userId}            – reserved for future provider-specific cache
 *   codeforces:profile:{userId}          – reserved for future provider-specific cache
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

// lucyUsername → userId mapping key (avoids DB lookup on every profile view)
export const lucyUsernameKey = (lucyUsername) => `lucy:username:${lucyUsername.toLowerCase()}`;
export const LUCY_USERNAME_TTL = 600; // 10 minutes

// ─── Codeforces provider keys ─────────────────────────────────────────────────
// Follows the same provider-namespaced pattern as LeetCode above.
// Future providers (CodeChef, GFG, Github) should add their own section here.

/** Dedup lock for Codeforces sync jobs — mirrors syncLockKey above. */
export const cfSyncLockKey = (userId) => `lock:codeforces:sync:${userId}`;

/**
 * TTL for the Codeforces sync lock in seconds.
 * Codeforces API (user.info + user.status + contest.rating) involves 3 HTTP
 * calls so we allow 180 s — slightly longer than the LeetCode lock.
 */
export const CF_SYNC_LOCK_TTL = 180;

/**
 * Optional per-user Codeforces stats cache key.
 * Populated after a successful sync; invalidated when the user syncs again
 * or updates their codeforcesUsername.
 * Redis is NOT the source of truth — DB is authoritative.
 */
export const cfStatsKey = (userId) => `codeforces:profile:${userId}`;

/** TTL for the cached Codeforces stats blob (5 minutes, same as dashboard). */
export const CF_STATS_TTL = 300;
// ─────────────────────────────────────────────────────────────────────────────

// ─── Platform-specific dashboard cache keys ──────────────────────────────────
// Separate from the combined dashboard key so platform views can be cached
// independently and invalidated only when the relevant provider syncs.

/** Cached LeetCode-only dashboard DTO for a user. */
export const lcDashboardKey  = (userId) => `platform:leetcode:dashboard:${userId}`;
/** Cached Codeforces-only dashboard DTO for a user. */
export const cfDashboardKey  = (userId) => `platform:codeforces:dashboard:${userId}`;

/** TTL for platform dashboard blobs (5 minutes). */
export const PLATFORM_DASHBOARD_TTL = 300;
// ─────────────────────────────────────────────────────────────────────────────
