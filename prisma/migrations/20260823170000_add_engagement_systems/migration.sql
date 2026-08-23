-- CreateEnum
CREATE TYPE "WatchSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLAIMED');

-- CreateEnum
CREATE TYPE "RaffleRoundStatus" AS ENUM ('OPEN', 'DRAWING', 'CLOSED');

-- CreateEnum
CREATE TYPE "HuntStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'WAITING', 'SOLVED');

-- CreateTable
CREATE TABLE "WatchSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'kick',
    "streamId" TEXT NOT NULL DEFAULT 'default',
    "status" "WatchSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "dailyBonusAwarded" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleRound" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ticketRateWager" INTEGER NOT NULL DEFAULT 10000,
    "status" "RaffleRoundStatus" NOT NULL DEFAULT 'OPEN',
    "winnerEntryId" TEXT,
    "drawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "tickets" INTEGER NOT NULL DEFAULT 0,
    "entries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "ticketCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusHuntSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "status" "HuntStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startBankroll" INTEGER NOT NULL DEFAULT 0,
    "currentBankroll" INTEGER NOT NULL DEFAULT 0,
    "bonusCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "totalPayout" INTEGER NOT NULL DEFAULT 0,
    "bestMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BonusHuntSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuntFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntClip" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntClip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntClipVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuntClipVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntClipSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuntClipSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchSession_userId_status_idx" ON "WatchSession"("userId", "status");

-- CreateIndex
CREATE INDEX "WatchSession_userId_startedAt_idx" ON "WatchSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "RaffleRound_status_idx" ON "RaffleRound"("status");

-- CreateIndex
CREATE INDEX "RaffleRound_createdAt_idx" ON "RaffleRound"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleAccount_userId_roundId_key" ON "RaffleAccount"("userId", "roundId");

-- CreateIndex
CREATE INDEX "RaffleAccount_roundId_idx" ON "RaffleAccount"("roundId");

-- CreateIndex
CREATE INDEX "RaffleEntry_userId_idx" ON "RaffleEntry"("userId");

-- CreateIndex
CREATE INDEX "RaffleEntry_roundId_idx" ON "RaffleEntry"("roundId");

-- CreateIndex
CREATE INDEX "BonusHuntSession_status_idx" ON "BonusHuntSession"("status");

-- CreateIndex
CREATE INDEX "BonusHuntSession_active_sortOrder_idx" ON "BonusHuntSession"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HuntFollow_userId_huntId_key" ON "HuntFollow"("userId", "huntId");

-- CreateIndex
CREATE INDEX "HuntFollow_huntId_idx" ON "HuntFollow"("huntId");

-- CreateIndex
CREATE INDEX "HuntClip_huntId_idx" ON "HuntClip"("huntId");

-- CreateIndex
CREATE UNIQUE INDEX "HuntClipVote_userId_clipId_key" ON "HuntClipVote"("userId", "clipId");

-- CreateIndex
CREATE INDEX "HuntClipVote_clipId_idx" ON "HuntClipVote"("clipId");

-- CreateIndex
CREATE UNIQUE INDEX "HuntClipSave_userId_clipId_key" ON "HuntClipSave"("userId", "clipId");

-- CreateIndex
CREATE INDEX "HuntClipSave_clipId_idx" ON "HuntClipSave"("clipId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_updatedAt_idx" ON "SupportTicket"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "WatchSession" ADD CONSTRAINT "WatchSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleAccount" ADD CONSTRAINT "RaffleAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleAccount" ADD CONSTRAINT "RaffleAccount_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "RaffleRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "RaffleRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntFollow" ADD CONSTRAINT "HuntFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntFollow" ADD CONSTRAINT "HuntFollow_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "BonusHuntSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntClip" ADD CONSTRAINT "HuntClip_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "BonusHuntSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntClipVote" ADD CONSTRAINT "HuntClipVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntClipVote" ADD CONSTRAINT "HuntClipVote_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "HuntClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntClipSave" ADD CONSTRAINT "HuntClipSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntClipSave" ADD CONSTRAINT "HuntClipSave_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "HuntClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
