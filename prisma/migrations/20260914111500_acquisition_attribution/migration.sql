-- Privacy-first acquisition attribution. Values are normalized source/campaign/use-case labels only.
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

CREATE FUNCTION copy_poll_acquisition_from_creator() RETURNS trigger AS $$
BEGIN
  SELECT "acquisitionSource", "acquisitionCampaign", "acquisitionUseCase"
    INTO NEW."acquisitionSource", NEW."acquisitionCampaign", NEW."acquisitionUseCase"
  FROM "User"
  WHERE id = NEW."creatorId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Poll_copy_acquisition"
BEFORE INSERT ON "Poll"
FOR EACH ROW EXECUTE FUNCTION copy_poll_acquisition_from_creator();
