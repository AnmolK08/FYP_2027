-- Migration: add_scoring
-- Adds Lucy V1 score columns to users, leetcode_stats, and codeforces_stats.
-- Non-destructive: all columns are nullable or have safe defaults.

-- 1. lucyScore on users (combined platform score for global leaderboard)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "lucy_score" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "users_lucy_score_idx" ON "users"("lucy_score");

-- 2. leetcodeScore on leetcode_stats (platform-specific leaderboard score)
ALTER TABLE "leetcode_stats"
  ADD COLUMN IF NOT EXISTS "leetcode_score" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "leetcode_stats_leetcode_score_idx" ON "leetcode_stats"("leetcode_score");

-- 3. codeforcesScore on codeforces_stats (platform-specific leaderboard score)
ALTER TABLE "codeforces_stats"
  ADD COLUMN IF NOT EXISTS "codeforces_score" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "codeforces_stats_codeforces_score_idx" ON "codeforces_stats"("codeforces_score");
