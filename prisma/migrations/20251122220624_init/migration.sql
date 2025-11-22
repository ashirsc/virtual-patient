-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('student', 'instructor', 'admin');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_actor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "allow_submissions" BOOLEAN NOT NULL DEFAULT true,
    "demographics" TEXT NOT NULL DEFAULT '',
    "chief_complaint" TEXT NOT NULL DEFAULT '',
    "medical_history" TEXT NOT NULL DEFAULT '',
    "medications" TEXT NOT NULL DEFAULT '',
    "social_history" TEXT NOT NULL DEFAULT '',
    "personality" TEXT NOT NULL DEFAULT '',
    "physical_findings" TEXT NOT NULL DEFAULT '',
    "additional_symptoms" TEXT NOT NULL DEFAULT '',
    "revelation_level" TEXT NOT NULL DEFAULT 'moderate',
    "stay_in_character" BOOLEAN NOT NULL DEFAULT true,
    "avoid_medical_jargon" BOOLEAN NOT NULL DEFAULT true,
    "provide_feedback" BOOLEAN NOT NULL DEFAULT true,
    "custom_instructions" TEXT NOT NULL DEFAULT '',
    "prompt" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_actor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "patient_actor_id" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submitted_session" (
    "id" TEXT NOT NULL,
    "chat_session_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "grade" TEXT,
    "feedback" TEXT,
    "rubric_scores" JSONB,
    "ai_grades" JSONB,
    "requires_review" BOOLEAN NOT NULL DEFAULT false,
    "auto_graded" BOOLEAN NOT NULL DEFAULT false,
    "ai_graded_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "submitted_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_rubric" (
    "id" TEXT NOT NULL,
    "patient_actor_id" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "passingThreshold" INTEGER,
    "autoGradeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_rubric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_account_id_key" ON "account"("provider_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "patient_actor_slug_key" ON "patient_actor"("slug");

-- CreateIndex
CREATE INDEX "patient_actor_slug_idx" ON "patient_actor"("slug");

-- CreateIndex
CREATE INDEX "chat_session_user_id_idx" ON "chat_session"("user_id");

-- CreateIndex
CREATE INDEX "chat_session_patient_actor_id_idx" ON "chat_session"("patient_actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "submitted_session_chat_session_id_key" ON "submitted_session"("chat_session_id");

-- CreateIndex
CREATE INDEX "submitted_session_instructor_id_idx" ON "submitted_session"("instructor_id");

-- CreateIndex
CREATE INDEX "submitted_session_status_idx" ON "submitted_session"("status");

-- CreateIndex
CREATE INDEX "submitted_session_requires_review_idx" ON "submitted_session"("requires_review");

-- CreateIndex
CREATE UNIQUE INDEX "grading_rubric_patient_actor_id_key" ON "grading_rubric"("patient_actor_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_actor" ADD CONSTRAINT "patient_actor_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_patient_actor_id_fkey" FOREIGN KEY ("patient_actor_id") REFERENCES "patient_actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_session" ADD CONSTRAINT "submitted_session_chat_session_id_fkey" FOREIGN KEY ("chat_session_id") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_session" ADD CONSTRAINT "submitted_session_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_rubric" ADD CONSTRAINT "grading_rubric_patient_actor_id_fkey" FOREIGN KEY ("patient_actor_id") REFERENCES "patient_actor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
