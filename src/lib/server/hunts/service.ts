import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";

export type HuntPayload = {
  id: string;
  title: string;
  time: string;
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

const DEFAULT_HUNTS = [
  {
    title: "Midnight Multiplier",
    host: "Vanta",
    status: "LIVE" as const,
    startBankroll: 250000,
    currentBankroll: 215000,
    bonusCount: 25,
    openedCount: 18,
    totalPayout: 186000,
    bestMultiplier: 860,
    sortOrder: 10,
    startsInMinutes: -30,
    clips: [
      { title: "860x reveal", multiplier: 860, votes: 124 },
      { title: "Last-spin save", multiplier: 190, votes: 81 },
    ],
  },
  {
    title: "Neon Chase",
    host: "Luxe",
    status: "SCHEDULED" as const,
    startBankroll: 180000,
    currentBankroll: 180000,
    bonusCount: 20,
    openedCount: 0,
    totalPayout: 0,
    bestMultiplier: 0,
    sortOrder: 20,
    startsInMinutes: 90,
    clips: [{ title: "Vault streak", multiplier: 240, votes: 57 }],
  },
  {
    title: "Vault Break",
    host: "Midas",
    status: "SCHEDULED" as const,
    startBankroll: 320000,
    currentBankroll: 320000,
    bonusCount: 30,
    openedCount: 0,
    totalPayout: 0,
    bestMultiplier: 0,
    sortOrder: 30,
    startsInMinutes: 180,
    clips: [],
  },
];

type HuntStatus = "SCHEDULED" | "LIVE" | "COMPLETED";

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
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

async function seedHuntsIfEmpty() {
  const count = await prisma.bonusHuntSession.count({ where: { active: true } });
  if (count > 0) return;

  const now = Date.now();
  for (const hunt of DEFAULT_HUNTS) {
    await prisma.bonusHuntSession.create({
      data: {
        title: hunt.title,
        host: hunt.host,
        status: hunt.status,
        startBankroll: hunt.startBankroll,
        currentBankroll: hunt.currentBankroll,
        bonusCount: hunt.bonusCount,
        openedCount: hunt.openedCount,
        totalPayout: hunt.totalPayout,
        bestMultiplier: hunt.bestMultiplier,
        sortOrder: hunt.sortOrder,
        startsAt: new Date(now + hunt.startsInMinutes * 60 * 1000),
        clips: {
          create: hunt.clips.map((clip) => ({
            title: clip.title,
            multiplier: clip.multiplier,
            votes: clip.votes,
          })),
        },
      },
    });
  }
}

export async function listHunts(
  sessionToken: string | undefined
): Promise<HuntsPayload> {
  await seedHuntsIfEmpty();

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

export async function toggleHuntFollow(
  sessionToken: string | undefined,
  huntId: string
): Promise<HuntsPayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to follow hunts.");

  const hunt = await prisma.bonusHuntSession.findFirst({
    where: { id: huntId, active: true },
    select: { id: true },
  });
  if (!hunt) throw new Error("Hunt not found.");

  const existing = await prisma.huntFollow.findUnique({
    where: { userId_huntId: { userId, huntId } },
  });

  if (existing) {
    await prisma.huntFollow.delete({ where: { id: existing.id } });
  } else {
    await prisma.huntFollow.create({ data: { userId, huntId } });
  }

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

  const clip = await prisma.huntClip.findUnique({ where: { id: clipId } });
  if (!clip) throw new Error("Clip not found.");

  const existing = await prisma.huntClipSave.findUnique({
    where: { userId_clipId: { userId, clipId } },
  });

  if (existing) {
    await prisma.huntClipSave.delete({ where: { id: existing.id } });
  } else {
    await prisma.huntClipSave.create({ data: { userId, clipId } });
  }

  return listHunts(sessionToken);
}
