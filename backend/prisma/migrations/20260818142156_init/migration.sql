-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "college" TEXT,
    "department" TEXT,
    "leetcode_username" TEXT,
    "avatar" TEXT,
    "daily_goal" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leetcode_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "leetcode_username" TEXT,
    "real_name" TEXT,
    "avatar" TEXT,
    "total_solved" INTEGER NOT NULL DEFAULT 0,
    "easy" INTEGER NOT NULL DEFAULT 0,
    "medium" INTEGER NOT NULL DEFAULT 0,
    "hard" INTEGER NOT NULL DEFAULT 0,
    "contest_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contests_attended" INTEGER NOT NULL DEFAULT 0,
    "global_ranking" INTEGER NOT NULL DEFAULT 0,
    "top_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" JSONB,
    "rating_history" JSONB,
    "submission_calendar" JSONB,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "active_days" INTEGER NOT NULL DEFAULT 0,
    "universal_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_synced" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leetcode_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "solved_snapshot" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_docs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "chunks" JSONB,
    "n_chunks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_interviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "problem_title" TEXT NOT NULL,
    "problem_description" TEXT,
    "starter_code" TEXT,
    "language" TEXT NOT NULL DEFAULT 'javascript',
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "code" TEXT,
    "score" INTEGER,
    "feedback" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leetcode_stats_user_id_key" ON "leetcode_stats"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_user_id_date_key" ON "activity"("user_id", "date");

-- CreateIndex
CREATE INDEX "chat_messages_user_id_session_id_idx" ON "chat_messages"("user_id", "session_id");

-- AddForeignKey
ALTER TABLE "leetcode_stats" ADD CONSTRAINT "leetcode_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_docs" ADD CONSTRAINT "knowledge_docs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interviews" ADD CONSTRAINT "mock_interviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
