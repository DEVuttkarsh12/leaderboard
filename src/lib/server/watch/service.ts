import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import type { Prisma } from "@/generated/prisma/client";

const POINTS_PER_SLICE = 25;
const SLICE_SECONDS = 10;
const DAILY_KICK_BONUS = 500;
const MAX_HEARTBEAT_SECONDS = 120;

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
  claimablePoints: number;
  dailyBonusAvailable: boolean;
  dailyBonus: number;
  rateLabel: string;
  points: number;
  xp: number;
};

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function elapsedSeconds(from: Date, to: Date) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
}

function claimableFor(totalSeconds: number, pointsAwarded: number) {
  const earned = Math.floor(totalSeconds / SLICE_SECONDS) * POINTS_PER_SLICE;
  return Math.max(0, earned - pointsAwarded);
}

async function requireKickUser(sessionToken: string | undefined) {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to earn watch points.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, kickId: true, kickUsername: true, points: true, xp: true },
  });
  if (!user) throw new Error("Session expired.");
  if (!user.kickUsername) throw new Error("Connect Kick to earn watch points.");

  return user;
}

function verificationMode(): "oauth" | "chat" {
  const configured = process.env.KICK_WATCH_VERIFICATION_MODE?.trim().toLowerCase();
  if (configured === "chat") return "chat";
  if (configured === "oauth") return "oauth";
  return process.env.KICK_WATCH_CHANNEL_SLUG?.trim() ? "chat" : "oauth";
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
      verificationMessage: "Kick OAuth linked.",
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
    prisma.kickStreamStatus.findUnique({ where: { channelSlug } }),
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
  const requireLive = process.env.KICK_WATCH_REQUIRE_LIVE !== "false";
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
  now: Date
) {
  const sessions = await tx.watchSession.findMany({
    where: { userId, startedAt: { gte: startOfToday() } },
    orderBy: { startedAt: "asc" },
  });

  let baseAward = 0;
  for (const session of sessions) {
    const earnedForSession =
      Math.floor(session.totalSeconds / SLICE_SECONDS) * POINTS_PER_SLICE;
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
  if (baseAward > 0 && latestSession && !sessions.some((session) => session.dailyBonusAwarded)) {
    const update = await tx.watchSession.updateMany({
      where: { id: latestSession.id, dailyBonusAwarded: false },
      data: { dailyBonusAwarded: true },
    });
    if (update.count === 1) dailyBonus = DAILY_KICK_BONUS;
  }

  const totalAward = baseAward + dailyBonus;
  if (totalAward <= 0) return;

  await tx.user.update({
    where: { id: userId },
    data: {
      points: { increment: totalAward },
      xp: { increment: baseAward },
    },
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
    select: { id: true, kickId: true, kickUsername: true, points: true, xp: true },
  });
  if (!user) throw new Error("Session expired.");

  const [sessions, running] = await Promise.all([
    prisma.watchSession.findMany({
      where: { userId, startedAt: { gte: startOfToday() } },
      select: {
        totalSeconds: true,
        pointsAwarded: true,
        dailyBonusAwarded: true,
      },
    }),
    prisma.watchSession.count({ where: { userId, status: "ACTIVE" } }),
  ]);

  const totalSecondsToday = sessions.reduce((sum, session) => sum + session.totalSeconds, 0);
  const claimablePoints = sessions.reduce(
    (sum, session) => sum + claimableFor(session.totalSeconds, session.pointsAwarded),
    0
  );
  const earnedPointsToday = sessions.reduce(
    (sum, session) => sum + session.pointsAwarded,
    sessions.some((session) => session.dailyBonusAwarded) ? DAILY_KICK_BONUS : 0
  );
  const dailyBonusAvailable =
    Boolean(user.kickUsername) && !sessions.some((session) => session.dailyBonusAwarded);
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
    claimablePoints,
    dailyBonusAvailable,
    dailyBonus: DAILY_KICK_BONUS,
    rateLabel: `${POINTS_PER_SLICE} / ${SLICE_SECONDS}s`,
    points: user.points,
    xp: user.xp,
  };
}

export async function recordWatchHeartbeat(
  sessionToken: string | undefined,
  running: boolean
): Promise<WatchSummaryPayload> {
  const user = await requireKickUser(sessionToken);
  const now = new Date();
  const verification = await verifyWatchActivity(user);

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
          startedAt: now,
          lastHeartbeatAt: now,
        },
      });
      await settleTodayWatchPoints(tx, user.id, now);
      return;
    }

    if (!active) {
      if (verification.verified) await settleTodayWatchPoints(tx, user.id, now);
      return;
    }

    const delta = verification.verified
      ? Math.min(MAX_HEARTBEAT_SECONDS, elapsedSeconds(active.lastHeartbeatAt, now))
      : 0;
    const heartbeatUpdate = await tx.watchSession.updateMany({
      where: {
        id: active.id,
        status: "ACTIVE",
        lastHeartbeatAt: active.lastHeartbeatAt,
      },
      data: {
        totalSeconds: { increment: delta },
        lastHeartbeatAt: now,
        ...(running ? {} : { status: "PAUSED" as const, endedAt: now }),
      },
    });

    if (!running && heartbeatUpdate.count === 0) {
      await tx.watchSession.updateMany({
        where: { id: active.id, status: "ACTIVE" },
        data: { status: "PAUSED", endedAt: now, lastHeartbeatAt: now },
      });
    }

    if (verification.verified) await settleTodayWatchPoints(tx, user.id, now);
  });

  return getWatchSummary(sessionToken);
}

export async function claimWatchPoints(
  sessionToken: string | undefined
): Promise<WatchSummaryPayload> {
  const user = await requireKickUser(sessionToken);
  const verification = await verifyWatchActivity(user);
  if (!verification.verified) {
    throw new Error(verification.verificationMessage);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const active = await tx.watchSession.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
    });

    if (active) {
      const delta = Math.min(
        MAX_HEARTBEAT_SECONDS,
        elapsedSeconds(active.lastHeartbeatAt, now)
      );
      await tx.watchSession.updateMany({
        where: {
          id: active.id,
          status: "ACTIVE",
          lastHeartbeatAt: active.lastHeartbeatAt,
        },
        data: {
          totalSeconds: { increment: delta },
          lastHeartbeatAt: now,
        },
      });
    }

    await settleTodayWatchPoints(tx, user.id, now);
  });

  return getWatchSummary(sessionToken);
}
