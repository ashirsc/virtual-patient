-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'student';

-- CreateTable
CREATE TABLE "chat_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "patientActorId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submitted_session" (
    "id" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "grade" TEXT,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "submitted_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_session_userId_idx" ON "chat_session"("userId");

-- CreateIndex
CREATE INDEX "chat_session_patientActorId_idx" ON "chat_session"("patientActorId");

-- CreateIndex
CREATE UNIQUE INDEX "submitted_session_chatSessionId_key" ON "submitted_session"("chatSessionId");

-- CreateIndex
CREATE INDEX "submitted_session_instructorId_idx" ON "submitted_session"("instructorId");

-- CreateIndex
CREATE INDEX "submitted_session_status_idx" ON "submitted_session"("status");

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_patientActorId_fkey" FOREIGN KEY ("patientActorId") REFERENCES "PatientActor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_session" ADD CONSTRAINT "submitted_session_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submitted_session" ADD CONSTRAINT "submitted_session_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
