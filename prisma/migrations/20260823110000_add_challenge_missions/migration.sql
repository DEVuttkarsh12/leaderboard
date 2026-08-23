-- CreateEnum
CREATE TYPE "ChallengeCadence" AS ENUM ('DAILY', 'WEEKLY', 'MILESTONE', 'SEASONAL');

-- CreateTable
CREATE TABLE "ChallengeMission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reward" INTEGER NOT NULL,
    "goal" INTEGER NOT NULL DEFAULT 100,
    "meta" TEXT NOT NULL,
    "cadence" "ChallengeCadence" NOT NULL DEFAULT 'DAILY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMission_code_key" ON "ChallengeMission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeProgress_userId_missionId_key" ON "ChallengeProgress"("userId", "missionId");

-- CreateIndex
CREATE INDEX "ChallengeProgress_userId_idx" ON "ChallengeProgress"("userId");

-- CreateIndex
CREATE INDEX "ChallengeProgress_missionId_idx" ON "ChallengeProgress"("missionId");

-- AddForeignKey
ALTER TABLE "ChallengeProgress" ADD CONSTRAINT "ChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeProgress" ADD CONSTRAINT "ChallengeProgress_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "ChallengeMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
