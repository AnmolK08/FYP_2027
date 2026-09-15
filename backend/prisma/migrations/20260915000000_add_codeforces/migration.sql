-- Migration: add_codeforces
-- Adds codeforcesUsername to users and creates codeforces_stats table.
-- Designed to be non-destructive: existing users, leetcode_stats, and all
-- other tables are completely untouched.

-- 1. Add codeforcesUsername column to users (nullable, no default)
ALTER TABLE "users" ADD COLUMN "codeforces_username" TEXT;

-- 2. Add lucy_username column if it is missing (added in a prior migration on some envs)
--    Safe no-op if column already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'lucy_username'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "lucy_username" TEXT UNIQUE;
  END IF;
END$$;

-- 3. Create codeforces_stats table
CREATE TABLE "codeforces_stats" (
    "id"                  TEXT NOT NULL,
    "user_id"             TEXT NOT NULL,

    -- Profile
    "handle"              TEXT,
    "avatar"              TEXT,
    "first_name"          TEXT,
    "last_name"           TEXT,
    "country"             TEXT,
    "city"                TEXT,
    "organization"        TEXT,

    -- Ratings & rank
    "rating"              INTEGER NOT NULL DEFAULT 0,
    "max_rating"          INTEGER NOT NULL DEFAULT 0,
    "rank"                TEXT,
    "max_rank"            TEXT,

    -- Social
    "contribution"        INTEGER NOT NULL DEFAULT 0,
    "friend_of_count"     INTEGER NOT NULL DEFAULT 0,

    -- Solved / submission statistics
    "total_solved"        INTEGER NOT NULL DEFAULT 0,
    "total_submissions"   INTEGER NOT NULL DEFAULT 0,

    -- Contest participation
    "contests_attended"   INTEGER NOT NULL DEFAULT 0,

    -- Rich JSON blobs
    "rating_history"      JSONB,
    "tag_stats"           JSONB,
    "verdict_stats"       JSONB,
    "language_stats"      JSONB,
    "recent_submissions"  JSONB,

    -- Timestamps
    "last_synced"         TIMESTAMP(3),
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codeforces_stats_pkey" PRIMARY KEY ("id")
);

-- 4. Foreign key: cascade delete when user is deleted
ALTER TABLE "codeforces_stats"
    ADD CONSTRAINT "codeforces_stats_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Unique constraint on user_id (1:1 relation)
ALTER TABLE "codeforces_stats"
    ADD CONSTRAINT "codeforces_stats_user_id_key" UNIQUE ("user_id");

-- 6. Indexes for leaderboard / analytics queries
CREATE INDEX "codeforces_stats_rating_idx"     ON "codeforces_stats"("rating");
CREATE INDEX "codeforces_stats_max_rating_idx" ON "codeforces_stats"("max_rating");
