import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import { requireAdminUser } from "@/lib/server/admin/users";
import type { Prisma } from "@/generated/prisma/client";
import { validateHuntProgress } from "@/lib/bonus-hunt";

type HuntStatus = "SCHEDULED" | "LIVE" | "COMPLETED";

export type HuntPayload = {
  id: string;
  title: string;
  time: string;
  startsAt: string | null;
  host: string;
  status: "Live" | "Upcoming" | "Completed";
  heat: number;
  followed: boolean;
  startBankroll: number;
  currentBankroll: number;
  bonusCount: number;
  openedCount: number;
  totalPayout: number;
  bestMultiplier: number;
  active: boolean;
  sortOrder: number;
};

export type HuntClipPayload = {
  id: string;
  huntId: string;
  title: string;
  stat: string;
  votes: number;
  saved: boolean;
  voted: boolean;
  multiplier: number;
};

export type HuntsPayload = {
  hunts: HuntPayload[];
  clips: HuntClipPayload[];
};

function statusLabel(status: HuntStatus): HuntPayload["status"] {
  switch (status) {
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Completed";
    case "SCHEDULED":
      return "Upcoming";
  }
}

function timeLabel(date: Date | null) {
  if (!date) return "TBA";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function heatFor(hunt: {
  startBankroll: number;
  currentBankroll: number;
  bonusCount: number;
  openedCount: number;
  status: HuntStatus;
}) {
  if (hunt.status === "COMPLETED") return 100;
  const progress = hunt.bonusCount > 0 ? (hunt.openedCount / hunt.bonusCount) * 100 : 0;
  const bankrollPressure =
    hunt.startBankroll > 0
      ? ((hunt.startBankroll - hunt.currentBankroll) / hunt.startBankroll) * 100
      : 0;
  return Math.max(0, Math.min(100, Math.round(progress * 0.7 + bankrollPressure * 0.3)));
}

async function lockHunt(tx: Prisma.TransactionClient, huntId: string, published = false) {
  const rows = await tx.$queryRaw<Array<{ id: string; active: boolean }>>`SELECT "id", "active" FROM "BonusHuntSession" WHERE "id" = ${huntId} FOR UPDATE`;
  if (!rows.length || (published && !rows[0].active)) throw new Error("Hunt not found.");
}

export async function listHunts(
  sessionToken: string | undefined
): Promise<HuntsPayload> {
  const userId = await getSessionUserId(sessionToken);
  const [hunts, follows, votes, saves] = await Promise.all([
    prisma.bonusHuntSession.findMany({
      where: { active: true },
      include: { clips: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    userId ? prisma.huntFollow.findMany({ where: { userId } }) : [],
    userId ? prisma.huntClipVote.findMany({ where: { userId } }) : [],
    userId ? prisma.huntClipSave.findMany({ where: { userId } }) : [],
  ]);

  const followed = new Set(follows.map((follow) => follow.huntId));
  const voted = new Set(votes.map((vote) => vote.clipId));
  const saved = new Set(saves.map((save) => save.clipId));

  return {
    hunts: hunts.map((hunt) => ({
      id: hunt.id,
      title: hunt.title,
      time: timeLabel(hunt.startsAt),
      startsAt: hunt.startsAt?.toISOString() ?? null,
      host: hunt.host,
      status: statusLabel(hunt.status),
      heat: heatFor(hunt),
      followed: followed.has(hunt.id),
      startBankroll: hunt.startBankroll,
      currentBankroll: hunt.currentBankroll,
      bonusCount: hunt.bonusCount,
      openedCount: hunt.openedCount,
      totalPayout: hunt.totalPayout,
      bestMultiplier: hunt.bestMultiplier,
      active: hunt.active,
      sortOrder: hunt.sortOrder,
    })),
    clips: hunts.flatMap((hunt) =>
      hunt.clips.map((clip) => ({
        id: clip.id,
        huntId: hunt.id,
        title: clip.title,
        stat: `${clip.multiplier.toLocaleString()}x`,
        votes: clip.votes,
        saved: saved.has(clip.id),
        voted: voted.has(clip.id),
        multiplier: clip.multiplier,
      }))
    ),
  };
}

export async function listAdminHunts(sessionToken: string | undefined): Promise<HuntsPayload> {
  await requireAdminUser(sessionToken);
  const hunts = await prisma.bonusHuntSession.findMany({
    include: { clips: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return {
    hunts: hunts.map((hunt) => ({
      id: hunt.id,
      title: hunt.title,
      time: timeLabel(hunt.startsAt),
      startsAt: hunt.startsAt?.toISOString() ?? null,
      host: hunt.host,
      status: statusLabel(hunt.status),
      heat: heatFor(hunt),
      followed: false,
      startBankroll: hunt.startBankroll,
      currentBankroll: hunt.currentBankroll,
      bonusCount: hunt.bonusCount,
      openedCount: hunt.openedCount,
      totalPayout: hunt.totalPayout,
      bestMultiplier: hunt.bestMultiplier,
      active: hunt.active,
      sortOrder: hunt.sortOrder,
    })),
    clips: hunts.flatMap((hunt) => hunt.clips.map((clip) => ({
      id: clip.id,
      huntId: hunt.id,
      title: clip.title,
      stat: `${clip.multiplier.toLocaleString()}x`,
      votes: clip.votes,
      saved: false,
      voted: false,
      multiplier: clip.multiplier,
    }))),
  };
}

export async function createAdminHunt(
  sessionToken: string | undefined,
  input: {
    title: string;
    host: string;
    status: HuntStatus;
    startsAt: Date | null;
    startBankroll: number;
    currentBankroll: number;
    bonusCount: number;
    openedCount: number;
    totalPayout: number;
    bestMultiplier: number;
    sortOrder: number;
    active: boolean;
  }
) {
  await requireAdminUser(sessionToken);
  validateHuntProgress(input);
  const hunt = await prisma.bonusHuntSession.create({ data: input });
  return hunt;
}

export async function updateAdminHunt(
  sessionToken: string | undefined,
  huntId: string,
  input: Partial<{
    title: string;
    host: string;
    status: HuntStatus;
    startsAt: Date | null;
    startBankroll: number;
    currentBankroll: number;
    bonusCount: number;
    openedCount: number;
    totalPayout: number;
    bestMultiplier: number;
    sortOrder: number;
    active: boolean;
  }>
) {
  await requireAdminUser(sessionToken);
  return prisma.$transaction(async (tx) => {
    await lockHunt(tx, huntId);
    const existing = await tx.bonusHuntSession.findUniqueOrThrow({ where: { id: huntId } });
    validateHuntProgress({ ...existing, ...input });
    return tx.bonusHuntSession.update({ where: { id: huntId }, data: input });
  });
}

export async function createAdminHuntClip(
  sessionToken: string | undefined,
  huntId: string,
  input: { title: string; multiplier: number }
) {
  await requireAdminUser(sessionToken);
  return prisma.$transaction(async (tx) => {
    await lockHunt(tx, huntId);
    return tx.huntClip.create({ data: { ...input, huntId } });
  });
}

export async function updateAdminHuntClip(
  sessionToken: string | undefined,
  huntId: string,
  clipId: string,
  input: Partial<{ title: string; multiplier: number }>
) {
  await requireAdminUser(sessionToken);
  return prisma.$transaction(async (tx) => {
    await lockHunt(tx, huntId);
    const clip = await tx.huntClip.findFirst({ where: { id: clipId, huntId }, select: { id: true } });
    if (!clip) throw new Error("Hunt highlight not found.");
    return tx.huntClip.update({ where: { id: clipId }, data: input });
  });
}

export async function deleteAdminHuntClip(
  sessionToken: string | undefined,
  huntId: string,
  clipId: string
) {
  await requireAdminUser(sessionToken);
  await prisma.$transaction(async (tx) => {
    await lockHunt(tx, huntId);
    const clip = await tx.huntClip.findFirst({ where: { id: clipId, huntId }, select: { id: true } });
    if (!clip) throw new Error("Hunt highlight not found.");
    await tx.huntClip.delete({ where: { id: clipId } });
  });
}

export async function toggleHuntFollow(
  sessionToken: string | undefined,
  huntId: string
): Promise<HuntsPayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to follow hunts.");

  await prisma.$transaction(async (tx) => {
    await lockHunt(tx, huntId, true);
    const existing = await tx.huntFollow.findUnique({ where: { userId_huntId: { userId, huntId } } });
    if (existing) await tx.huntFollow.delete({ where: { id: existing.id } });
    else await tx.huntFollow.create({ data: { userId, huntId } });
  });

  return listHunts(sessionToken);
}

export async function voteHuntClip(
  sessionToken: string | undefined,
  clipId: string
): Promise<HuntsPayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to vote on clips.");

  await prisma.$transaction(async (tx) => {
    const clip = await tx.huntClip.findUnique({ where: { id: clipId } });
    if (!clip) throw new Error("Clip not found.");
    await lockHunt(tx, clip.huntId, true);

    const existing = await tx.huntClipVote.findUnique({
      where: { userId_clipId: { userId, clipId } },
    });
    if (existing) return;

    await tx.huntClipVote.create({ data: { userId, clipId } });
    await tx.huntClip.update({
      where: { id: clipId },
      data: { votes: { increment: 1 } },
    });
  });

  return listHunts(sessionToken);
}

export async function toggleHuntClipSave(
  sessionToken: string | undefined,
  clipId: string
): Promise<HuntsPayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to save clips.");

  await prisma.$transaction(async (tx) => {
    const clip = await tx.huntClip.findUnique({ where: { id: clipId } });
    if (!clip) throw new Error("Clip not found.");
    await lockHunt(tx, clip.huntId, true);
    const existing = await tx.huntClipSave.findUnique({ where: { userId_clipId: { userId, clipId } } });
    if (existing) await tx.huntClipSave.delete({ where: { id: existing.id } });
    else await tx.huntClipSave.create({ data: { userId, clipId } });
  });

  return listHunts(sessionToken);
}
