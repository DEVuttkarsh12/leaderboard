import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";

export type ChallengeMissionPayload = {
  id: string;
  code: string;
  title: string;
  reward: number;
  goal: number;
  meta: string;
  cadence: "Daily" | "Weekly" | "Milestone" | "Seasonal";
  progress: number;
  claimed: boolean;
  claimedAt: string | null;
};

const DEFAULT_MISSIONS = [
  { code: "daily-spin", title: "Daily Missions", reward: 1200, goal: 100, meta: "Daily", cadence: "DAILY" as const, sortOrder: 10 },
  { code: "weekly-track", title: "Weekly Tracks", reward: 4200, goal: 100, meta: "Weekly", cadence: "WEEKLY" as const, sortOrder: 20 },
  { code: "milestone", title: "Milestone Goals", reward: 2800, goal: 100, meta: "Milestone", cadence: "MILESTONE" as const, sortOrder: 30 },
  { code: "seasonal", title: "Seasonal Campaigns", reward: 6500, goal: 100, meta: "Season", cadence: "SEASONAL" as const, sortOrder: 40 },
  { code: "rank-unlock", title: "Leaderboard Unlocks", reward: 3500, goal: 100, meta: "Rank", cadence: "MILESTONE" as const, sortOrder: 50 },
];

type MissionRow = {
  id: string;
  code: string;
  title: string;
  reward: number;
  goal: number;
  meta: string;
  cadence: "DAILY" | "WEEKLY" | "MILESTONE" | "SEASONAL";
};

type ProgressRow = {
  progress: number;
  claimedAt: Date | null;
};

async function seedMissionsIfEmpty(): Promise<void> {
  const count = await prisma.challengeMission.count({ where: { active: true } });
  if (count > 0) return;

  await prisma.challengeMission.createMany({
    data: DEFAULT_MISSIONS.map((mission) => ({ ...mission, active: true })),
  });
}

function displayCadence(cadence: MissionRow["cadence"]): ChallengeMissionPayload["cadence"] {
  switch (cadence) {
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "MILESTONE":
      return "Milestone";
    case "SEASONAL":
      return "Seasonal";
  }
}

function toPayload(
  mission: MissionRow,
  progress?: ProgressRow
): ChallengeMissionPayload {
  const charged = Math.min(mission.goal, Math.max(0, progress?.progress ?? 0));

  return {
    id: mission.id,
    code: mission.code,
    title: mission.title,
    reward: mission.reward,
    goal: mission.goal,
    meta: mission.meta,
    cadence: displayCadence(mission.cadence),
    progress: charged,
    claimed: Boolean(progress?.claimedAt),
    claimedAt: progress?.claimedAt ? progress.claimedAt.toISOString() : null,
  };
}

export async function listChallengeMissions(
  sessionToken: string | undefined
): Promise<ChallengeMissionPayload[]> {
  await seedMissionsIfEmpty();

  const userId = await getSessionUserId(sessionToken);
  const missions = await prisma.challengeMission.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      code: true,
      title: true,
      reward: true,
      goal: true,
      meta: true,
      cadence: true,
    },
  });

  if (!userId) {
    return missions.map((mission) => toPayload(mission));
  }

  const progressRows = await prisma.challengeProgress.findMany({
    where: { userId, missionId: { in: missions.map((mission) => mission.id) } },
    select: {
      missionId: true,
      progress: true,
      claimedAt: true,
    },
  });
  const progressByMission = new Map(
    progressRows.map((row) => [row.missionId, row])
  );

  return missions.map((mission) =>
    toPayload(mission, progressByMission.get(mission.id))
  );
}

export async function advanceChallengeProgress(
  sessionToken: string | undefined,
  missionId: string,
  amount: number = 25
): Promise<ChallengeMissionPayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to progress missions.");
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1000) {
    throw new Error("Enter a valid progress amount.");
  }

  await seedMissionsIfEmpty();

  return prisma.$transaction(async (tx) => {
    const mission = await tx.challengeMission.findFirst({
      where: { id: missionId, active: true },
      select: {
        id: true,
        code: true,
        title: true,
        reward: true,
        goal: true,
        meta: true,
        cadence: true,
      },
    });
    if (!mission) throw new Error("Mission not found.");

    const current = await tx.challengeProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
      select: {
        id: true,
        progress: true,
        claimedAt: true,
      },
    });

    if (current?.claimedAt) {
      return toPayload(mission, current);
    }

    const nextProgress = Math.min(mission.goal, (current?.progress ?? 0) + amount);
    const progress = current
      ? await tx.challengeProgress.update({
          where: { id: current.id },
          data: { progress: nextProgress },
          select: { progress: true, claimedAt: true },
        })
      : await tx.challengeProgress.create({
          data: { userId, missionId, progress: nextProgress },
          select: { progress: true, claimedAt: true },
        });

    return toPayload(mission, progress);
  });
}

export async function claimChallengeMission(
  sessionToken: string | undefined,
  missionId: string
): Promise<{
  mission: ChallengeMissionPayload;
  newPoints: number;
  newXp: number;
}> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to claim missions.");

  await seedMissionsIfEmpty();

  return prisma.$transaction(async (tx) => {
    const mission = await tx.challengeMission.findFirst({
      where: { id: missionId, active: true },
      select: {
        id: true,
        code: true,
        title: true,
        reward: true,
        goal: true,
        meta: true,
        cadence: true,
      },
    });
    if (!mission) throw new Error("Mission not found.");

    const progress = await tx.challengeProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
      select: {
        id: true,
        progress: true,
        claimedAt: true,
      },
    });
    if (!progress || progress.progress < mission.goal) {
      throw new Error("Mission is not ready to claim.");
    }
    if (progress.claimedAt) {
      throw new Error("Mission already claimed.");
    }

    const claimedAt = new Date();
    await tx.challengeProgress.update({
      where: { id: progress.id },
      data: { claimedAt, progress: mission.goal },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        points: { increment: mission.reward },
        xp: { increment: mission.reward },
      },
      select: { points: true, xp: true },
    });

    await tx.pointTransaction.create({
      data: {
        userId,
        amount: mission.reward,
        reason: "challenge_claim",
        meta: JSON.stringify({
          missionId: mission.id,
          missionCode: mission.code,
          missionTitle: mission.title,
        }),
      },
    });

    return {
      mission: toPayload(mission, { progress: mission.goal, claimedAt }),
      newPoints: updatedUser.points,
      newXp: updatedUser.xp,
    };
  });
}
