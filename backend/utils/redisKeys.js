// Redis key catalogue for the entire app.
//
// Key patterns:
//   user:{userId}:dashboard              – cached dashboard JSON (TTL 5 min)
//   user:{userId}:profile                – cached profile for leaderboard enrichment
//   lock:user:{userId}:dashboard         – stampede lock for dashboard rebuild
//   lock:leetcode:sync:{userId}          – dedup lock for LeetCode sync jobs
//   lock:codeforces:sync:{userId}        – dedup lock for Codeforces sync jobs
//   leaderboard:global                   – legacy global ZSET (universalScore)
//   leaderboard:{type}                   – platform-specific ZSETs
//   lucy:username:{lucyUsername}         – lucyUsername → userId mapping (TTL 10 min)
//   codeforces:profile:{userId}          – cached CF stats blob
//   platform:leetcode:dashboard:{userId} – cached LC-only dashboard DTO
//   platform:codeforces:dashboard:{userId} – cached CF-only dashboard DTO
//
// To add a new provider, add its lock key, stats key, and TTL constants here.

export const dashboardKey     = (userId) => `user:${userId}:dashboard`;
export const dashboardLockKey = (userId) => `lock:user:${userId}:dashboard`;

export const DASHBOARD_TTL      = 300;
export const DASHBOARD_LOCK_TTL = 10;

export const profileKey = (userId) => `user:${userId}:profile`;
export const PROFILE_TTL = 600;

export const leaderboardKey = (type = 'global', identifier = null) => {
  if (identifier) return `leaderboard:${type}:${identifier}`;
  return `leaderboard:${type}`;
};

// Temp key during atomic leaderboard rebuilds (write-to-temp, then RENAME)
export const leaderboardTempKey = (type = 'global', identifier = null) => {
  const base = leaderboardKey(type, identifier);
  return `${base}:rebuild_tmp`;
};

export const syncLockKey  = (userId) => `lock:leetcode:sync:${userId}`;
export const SYNC_LOCK_TTL = 120;

// Cache the lucyUsername → userId mapping to avoid a DB lookup on every public profile view
export const lucyUsernameKey  = (lucyUsername) => `lucy:username:${lucyUsername.toLowerCase()}`;
export const LUCY_USERNAME_TTL = 600;

export const cfSyncLockKey = (userId) => `lock:codeforces:sync:${userId}`;

// CF sync involves 3 API calls so the lock TTL is longer than the LeetCode one
export const CF_SYNC_LOCK_TTL = 180;

// Cache is populated after a successful sync; DB remains the source of truth
export const cfStatsKey  = (userId) => `codeforces:profile:${userId}`;
export const CF_STATS_TTL = 300;

// Platform dashboard caches are invalidated independently so a LC sync doesn't
// bust the CF cache and vice versa
export const lcDashboardKey = (userId) => `platform:leetcode:dashboard:${userId}`;
export const cfDashboardKey = (userId) => `platform:codeforces:dashboard:${userId}`;
export const PLATFORM_DASHBOARD_TTL = 300;
