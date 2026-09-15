-- Snapshot the earning rate on each session so later admin changes are not retroactive.
ALTER TABLE "WatchSession"
ADD COLUMN "awardPoints" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN "awardIntervalSeconds" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "dailyBonusPoints" INTEGER NOT NULL DEFAULT 0;

UPDATE "WatchSession"
SET "dailyBonusPoints" = 500
WHERE "dailyBonusAwarded" = TRUE;

CREATE TABLE "WatchPointConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "pointsPerInterval" INTEGER NOT NULL DEFAULT 50,
  "intervalSeconds" INTEGER NOT NULL DEFAULT 60,
  "dailyBonus" INTEGER NOT NULL DEFAULT 0,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WatchPointConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "WatchPointConfig" (
  "id",
  "pointsPerInterval",
  "intervalSeconds",
  "dailyBonus",
  "updatedAt"
) VALUES ('default', 50, 60, 0, CURRENT_TIMESTAMP);
