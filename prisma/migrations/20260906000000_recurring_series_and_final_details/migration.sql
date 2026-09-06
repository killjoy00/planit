-- A closed poll can now hand off to an actual plan: optional final details are
-- carried into result messages/pages and calendar exports.
ALTER TABLE "Poll"
  ADD COLUMN "finalLocation" TEXT,
  ADD COLUMN "finalNotes" TEXT;

-- Recurring series use the latest occurrence as their template. Each poll has
-- a stable sequence number so concurrent close/cancel paths can only create one
-- next occurrence.
CREATE TYPE "RecurrenceCadence" AS ENUM ('WEEKLY', 'MONTHLY');

CREATE TABLE "RecurringSeries" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "cadence" "RecurrenceCadence" NOT NULL,
  "interval" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RecurringSeries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Poll"
  ADD COLUMN "seriesId" TEXT,
  ADD COLUMN "seriesSequence" INTEGER;

CREATE INDEX "RecurringSeries_creatorId_active_idx" ON "RecurringSeries"("creatorId", "active");
CREATE UNIQUE INDEX "Poll_seriesId_seriesSequence_key" ON "Poll"("seriesId", "seriesSequence");

ALTER TABLE "RecurringSeries"
  ADD CONSTRAINT "RecurringSeries_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Poll"
  ADD CONSTRAINT "Poll_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "RecurringSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
