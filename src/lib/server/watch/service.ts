import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import { getPublicKickStream } from "@/lib/server/kick/events";
import type { Prisma } from "@/generated/prisma/client";

const HEARTBEAT_GRACE_SECONDS = 30;
const WATCH_CONFIG_ID = "default";

export type WatchPointConfigPayload = {
  pointsPerInterval: number;
  intervalSeconds: number;
  dailyBonus: number;
  updatedAt: string;
};

export type WatchSummaryPayload = {
  connected: boolean;
  running: boolean;
  verified: boolean;
  verificationMode: "oauth" | "chat";
  verificationMessage: string;
  streamLive: boolean;
  lastActivityAt: string | null;
  totalSecondsToday: number;
  earnedPointsToday: number;
  dailyBonusAvailable: boolean;
  dailyBonus: number;
  rateLabel: string;
  points: number;
};

function formatRate(points: number, seconds: number) {
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${points} / ${minutes}m`;
  }
  return `${points} / ${seconds}s`;
}

function toWatchPointConfigPayload(config: {
  pointsPerInterval: number;
  intervalSeconds: number;
  dailyBonus: number;
  updatedAt: Date;
}): WatchPointConfigPayload {
  return {
    pointsPerInterval: config.pointsPerInterval,
    intervalSeconds: config.intervalSeconds,
    dailyBonus: config.dailyBonus,
    updatedAt: config.updatedAt.toISOString(),
  };
}

export async function getWatchPointConfig(): Promise<WatchPointConfigPayload> {
  const config = await prisma.watchPointConfig.upsert({
    where: { id: WATCH_CONFIG_ID },
    create: { id: WATCH_CONFIG_ID },
    update: {},
  });
  return toWatchPointConfigPayload(config);
}

export async function updateWatchPointConfig(
  input: Pick<WatchPointConfigPayload, "pointsPerInterval" | "intervalSeconds" | "dailyBonus">,
  adminId: string
): Promise<WatchPointConfigPayload> {
  const config = await prisma.watchPointConfig.upsert({
    where: { id: WATCH_CONFIG_ID },
    create: { id: WATCH_CONFIG_ID, ...input, updatedById: adminId },
    update: { ...input, updatedById: adminId },
  });
  return toWatchPointConfigPayload(config);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function elapsedSeconds(from: Date, to: Date) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
}

async function requireKickUser(sessionToken: string | undefined) {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to earn watch points.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, kickId: true, kickUsername: true, points: true },
  });
  if (!user) throw new Error("Session expired.");
  if (!user.kickUsername) throw new Error("Connect Kick to earn watch points.");

  return user;
}

function verificationMode(): "oauth" | "chat" {
  const configured = process.env.KICK_WATCH_VERIFICATION_MODE?.trim().toLowerCase();
  if (configured === "chat") return "chat";
  if (configured === "oauth" && process.env.NODE_ENV !== "production") return "oauth";
  return "chat";
}

function activityWindowMs() {
  const seconds = Number(process.env.KICK_WATCH_ACTIVITY_WINDOW_SECONDS ?? 15 * 60);
  return Math.max(60, Math.min(60 * 60, Number.isFinite(seconds) ? seconds : 15 * 60)) * 1000;
}

async function verifyWatchActivity(user: {
  kickId: string | null;
  kickUsername: string | null;
}) {
  const mode = verificationMode();

  if (mode === "oauth") {
    return {
      verified: Boolean(user.kickUsername),
      verificationMode: mode,
      verificationMessage: "Kick OAuth linked for local preview.",
      streamLive: true,
      lastActivityAt: null as string | null,
    };
  }

  const channelSlug = process.env.KICK_WATCH_CHANNEL_SLUG?.trim().replace(/^@+/, "").toLowerCase();
  if (!channelSlug) {
    return {
      verified: false,
      verificationMode: mode,
      verificationMessage: "KICK_WATCH_CHANNEL_SLUG is not configured.",
      streamLive: false,
      lastActivityAt: null as string | null,
    };
  }

  const since = new Date(Date.now() - activityWindowMs());
  const [stream, activity] = await Promise.all([
    getPublicKickStream(),
    prisma.kickChatActivity.findFirst({
      where: {
        channelSlug,
        receivedAt: { gte: since },
        OR: [
          ...(user.kickId ? [{ kickUserId: user.kickId }] : []),
          ...(user.kickUsername ? [{ username: user.kickUsername.toLowerCase() }] : []),
        ],
      },
      orderBy: { receivedAt: "desc" },
    }),
  ]);
  const requireLive =
    process.env.NODE_ENV === "production" ||
    process.env.KICK_WATCH_REQUIRE_LIVE !== "false";
  const streamLive = requireLive ? Boolean(stream?.isLive) : true;
  const verified = streamLive && Boolean(activity);

  return {
    verified,
    verificationMode: mode,
    verificationMessage: verified
      ? "Kick webhook activity verified."
      : streamLive
        ? "Send a Kick chat message to verify watch activity."
        : "Kick stream is not marked live yet.",
    streamLive,
    lastActivityAt: activity?.receivedAt.toISOString() ?? null,
  };
}

async function settleTodayWatchPoints(
  tx: Prisma.TransactionClient,
  userId: string,
  now: Date,
  config: WatchPointConfigPayload
) {
  const sessions = await tx.watchSession.findMany({
    where: { userId, startedAt: { gte: startOfToday() } },
    orderBy: { startedAt: "asc" },
  });

  let baseAward = 0;
  for (const session of sessions) {
    const earnedForSession =
      Math.floor(session.totalSeconds / session.awardIntervalSeconds) * session.awardPoints;
    const pending = Math.max(0, earnedForSession - session.pointsAwarded);
    if (pending <= 0) continue;

    const update = await tx.watchSession.updateMany({
      where: { id: session.id, pointsAwarded: session.pointsAwarded },
      data: { pointsAwarded: earnedForSession },
    });
    if (update.count === 1) baseAward += pending;
  }

  let dailyBonus = 0;
  const latestSession = sessions.at(-1);
  if (
    baseAward > 0 &&
    config.dailyBonus > 0 &&
    latestSession &&
    !sessions.some((session) => session.dailyBonusAwarded)
  ) {
    const update = await tx.watchSession.updateMany({
      where: { id: latestSession.id, dailyBonusAwarded: false },
      data: { dailyBonusAwarded: true, dailyBonusPoints: config.dailyBonus },
    });
    if (update.count === 1) dailyBonus = config.dailyBonus;
  }

  const totalAward = baseAward + dailyBonus;
  if (totalAward <= 0) return;

  await tx.user.update({
    where: { id: userId },
    data: { points: { increment: totalAward } },
  });

  await tx.pointTransaction.create({
    data: {
      userId,
      amount: totalAward,
      reason: "watch_points",
      meta: JSON.stringify({
        baseAward,
        dailyBonus,
        automatic: true,
        creditedAt: now.toISOString(),
        totalSeconds: sessions.reduce((sum, session) => sum + session.totalSeconds, 0),
      }),
    },
  });
}

export async function getWatchSummary(
  sessionToken: string | undefined
): Promise<WatchSummaryPayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to view watch points.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, kickId: true, kickUsername: true, points: true },
  });
  if (!user) throw new Error("Session expired.");

  const [sessions, running, config] = await Promise.all([
    prisma.watchSession.findMany({
      where: { userId, startedAt: { gte: startOfToday() } },
      select: {
        totalSeconds: true,
        pointsAwarded: true,
        dailyBonusAwarded: true,
        dailyBonusPoints: true,
      },
    }),
    prisma.watchSession.count({ where: { userId, status: "ACTIVE" } }),
    getWatchPointConfig(),
  ]);

  const totalSecondsToday = sessions.reduce((sum, session) => sum + session.totalSeconds, 0);
  const earnedPointsToday = sessions.reduce(
    (sum, session) => sum + session.pointsAwarded + session.dailyBonusPoints,
    0
  );
  const dailyBonusAvailable =
    config.dailyBonus > 0 &&
    Boolean(user.kickUsername) &&
    !sessions.some((session) => session.dailyBonusAwarded);
  const verification = user.kickUsername
    ? await verifyWatchActivity(user)
    : {
        verified: false,
        verificationMode: verificationMode(),
        verificationMessage: "Connect Kick to start earning.",
        streamLive: false,
        lastActivityAt: null,
      };

  return {
    connected: Boolean(user.kickUsername),
    running: running > 0,
    ...verification,
    totalSecondsToday,
    earnedPointsToday,
    dailyBonusAvailable,
    dailyBonus: config.dailyBonus,
    rateLabel: formatRate(config.pointsPerInterval, config.intervalSeconds),
    points: user.points,
  };
}

export async function recordWatchHeartbeat(
  sessionToken: string | undefined,
  running: boolean
): Promise<WatchSummaryPayload> {
  const user = await requireKickUser(sessionToken);
  const now = new Date();
  const [verification, config] = await Promise.all([
    verifyWatchActivity(user),
    getWatchPointConfig(),
  ]);

  if (running && !verification.verified) {
    await prisma.watchSession.updateMany({
      where: { userId: user.id, status: "ACTIVE" },
      data: { status: "PAUSED", endedAt: now, lastHeartbeatAt: now },
    });
    throw new Error(verification.verificationMessage);
  }

  await prisma.$transaction(async (tx) => {
    const active = await tx.watchSession.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
    });

    if (!active && running) {
      await tx.watchSession.create({
        data: {
          userId: user.id,
          provider: "kick",
          streamId: "default",
          status: "ACTIVE",
          awardPoints: config.pointsPerInterval,
          awardIntervalSeconds: config.intervalSeconds,
          startedAt: now,
          lastHeartbeatAt: now,
        },
      });
      await settleTodayWatchPoints(tx, user.id, now, config);
      return;
    }

    if (!active) {
      if (verification.verified) await settleTodayWatchPoints(tx, user.id, now, config);
      return;
    }

    const heartbeatGap = elapsedSeconds(active.lastHeartbeatAt, now);
    const delta = verification.verified && heartbeatGap <= HEARTBEAT_GRACE_SECONDS
      ? heartbeatGap
      : 0;
    const rateChanged =
      active.awardPoints !== config.pointsPerInterval ||
      active.awardIntervalSeconds !== config.intervalSeconds;
    const heartbeatUpdate = await tx.watchSession.updateMany({
      where: {
        id: active.id,
        status: "ACTIVE",
        lastHeartbeatAt: active.lastHeartbeatAt,
      },
      data: {
        totalSeconds: { increment: delta },
        lastHeartbeatAt: now,
        ...(running && !rateChanged ? {} : { status: "PAUSED" as const, endedAt: now }),
      },
    });

    if (running && rateChanged && heartbeatUpdate.count === 1) {
      await tx.watchSession.create({
        data: {
          userId: user.id,
          provider: "kick",
          streamId: "default",
          status: "ACTIVE",
          awardPoints: config.pointsPerInterval,
          awardIntervalSeconds: config.intervalSeconds,
          startedAt: now,
          lastHeartbeatAt: now,
        },
      });
    }

    if (!running && heartbeatUpdate.count === 0) {
      await tx.watchSession.updateMany({
        where: { id: active.id, status: "ACTIVE" },
        data: { status: "PAUSED", endedAt: now, lastHeartbeatAt: now },
      });
    }

    if (verification.verified) await settleTodayWatchPoints(tx, user.id, now, config);
  });

  return getWatchSummary(sessionToken);
}
