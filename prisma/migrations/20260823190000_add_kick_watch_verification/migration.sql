-- CreateTable
CREATE TABLE "KickChatActivity" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "kickUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "channelSlug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KickChatActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KickStreamStatus" (
    "id" TEXT NOT NULL,
    "channelSlug" TEXT NOT NULL,
    "broadcasterKickId" TEXT,
    "broadcasterUsername" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KickStreamStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KickChatActivity_messageId_key" ON "KickChatActivity"("messageId");

-- CreateIndex
CREATE INDEX "KickChatActivity_kickUserId_receivedAt_idx" ON "KickChatActivity"("kickUserId", "receivedAt");

-- CreateIndex
CREATE INDEX "KickChatActivity_username_receivedAt_idx" ON "KickChatActivity"("username", "receivedAt");

-- CreateIndex
CREATE INDEX "KickChatActivity_channelSlug_receivedAt_idx" ON "KickChatActivity"("channelSlug", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KickStreamStatus_channelSlug_key" ON "KickStreamStatus"("channelSlug");

-- CreateIndex
CREATE INDEX "KickStreamStatus_isLive_lastEventAt_idx" ON "KickStreamStatus"("isLive", "lastEventAt");
