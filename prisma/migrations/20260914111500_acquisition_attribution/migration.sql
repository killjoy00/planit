-- Store only normalized first-party attribution labels. No raw referrer URLs or IPs.
ALTER TABLE "User"
  ADD COLUMN "acquisitionSource" TEXT,
  ADD COLUMN "acquisitionCampaign" TEXT,
  ADD COLUMN "acquisitionUseCase" TEXT;

ALTER TABLE "Poll"
  ADD COLUMN "acquisitionSource" TEXT,
  ADD COLUMN "acquisitionCampaign" TEXT,
  ADD COLUMN "acquisitionUseCase" TEXT;

CREATE INDEX "User_acquisitionSource_acquisitionCampaign_idx"
  ON "User"("acquisitionSource", "acquisitionCampaign");
CREATE INDEX "User_acquisitionUseCase_idx"
  ON "User"("acquisitionUseCase");
CREATE INDEX "Poll_acquisitionSource_acquisitionCampaign_idx"
  ON "Poll"("acquisitionSource", "acquisitionCampaign");
CREATE INDEX "Poll_acquisitionUseCase_idx"
  ON "Poll"("acquisitionUseCase");
