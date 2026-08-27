-- New scheduling poll type and named-zone storage.
ALTER TYPE "PollType" ADD VALUE 'TIME_POLL';
ALTER TABLE "Poll" ADD COLUMN "timeZone" TEXT;

-- Graded availability for time slots.
CREATE TYPE "VotePreference" AS ENUM ('IDEAL', 'AVAILABLE');
ALTER TABLE "Vote" ADD COLUMN "preference" "VotePreference";

-- Record result delivery separately from invitation delivery so failed
-- announcements can be retried safely from the poll page.
ALTER TABLE "Participant"
  ADD COLUMN "resultSentAt" TIMESTAMP(3),
  ADD COLUMN "resultError" TEXT;

-- Extend the existing sign-in limiter to cover public join verification mail.
CREATE TYPE "EmailSendPurpose" AS ENUM ('SIGN_IN', 'JOIN');
ALTER TABLE "SignInAttempt"
  ADD COLUMN "purpose" "EmailSendPurpose" NOT NULL DEFAULT 'SIGN_IN',
  ADD COLUMN "scope" TEXT;

DROP INDEX "SignInAttempt_email_createdAt_idx";
DROP INDEX "SignInAttempt_ip_createdAt_idx";
CREATE INDEX "SignInAttempt_purpose_email_createdAt_idx" ON "SignInAttempt"("purpose", "email", "createdAt");
CREATE INDEX "SignInAttempt_purpose_ip_createdAt_idx" ON "SignInAttempt"("purpose", "ip", "createdAt");
CREATE INDEX "SignInAttempt_purpose_scope_createdAt_idx" ON "SignInAttempt"("purpose", "scope", "createdAt");
