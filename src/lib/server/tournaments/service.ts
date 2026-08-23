import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";

export type TournamentPayload = {
  id: string;
  title: string;
  starts: string;
  prize: string;
  seats: number;
  taken: number;
  joined: boolean;
  status: "Open" | "Locked" | "Completed";
};

const DEFAULT_TOURNAMENTS = [
  { code: "friday-rush", title: "Friday Rush", starts: "Tonight 21:00", prize: "40K pts", seats: 64, taken: 51, sortOrder: 10 },
  { code: "duel-ladder", title: "Duel Ladder", starts: "Tomorrow 18:30", prize: "25K pts", seats: 32, taken: 18, sortOrder: 20 },
  { code: "season-finals", title: "Season Finals", starts: "Sunday 20:00", prize: "120K pts", seats: 16, taken: 12, sortOrder: 30 },
];

type TournamentStatus = "OPEN" | "LOCKED" | "COMPLETED";

function statusLabel(status: TournamentStatus): TournamentPayload["status"] {
  switch (status) {
    case "OPEN":
      return "Open";
    case "LOCKED":
      return "Locked";
    case "COMPLETED":
      return "Completed";
  }
}

async function seedTournamentsIfEmpty() {
  const count = await prisma.tournament.count({ where: { active: true } });
  if (count > 0) return;

  await prisma.tournament.createMany({
    data: DEFAULT_TOURNAMENTS.map((tournament) => ({
      ...tournament,
      status: "OPEN" as const,
      active: true,
    })),
  });
}

export async function listTournaments(
  sessionToken: string | undefined
): Promise<TournamentPayload[]> {
  await seedTournamentsIfEmpty();
  const userId = await getSessionUserId(sessionToken);

  const [tournaments, entries] = await Promise.all([
    prisma.tournament.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    userId ? prisma.tournamentEntry.findMany({ where: { userId } }) : [],
  ]);
  const joined = new Set(entries.map((entry) => entry.tournamentId));

  return tournaments.map((tournament) => ({
    id: tournament.id,
    title: tournament.title,
    starts: tournament.starts,
    prize: tournament.prize,
    seats: tournament.seats,
    taken: tournament.taken,
    joined: joined.has(tournament.id),
    status: statusLabel(tournament.status),
  }));
}

export async function toggleTournamentEntry(
  sessionToken: string | undefined,
  tournamentId: string
): Promise<TournamentPayload[]> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to enter tournaments.");

  await seedTournamentsIfEmpty();

  await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findFirst({
      where: { id: tournamentId, active: true },
    });
    if (!tournament) throw new Error("Tournament not found.");
    if (tournament.status !== "OPEN") throw new Error("Tournament is not open.");

    const existing = await tx.tournamentEntry.findUnique({
      where: { userId_tournamentId: { userId, tournamentId } },
    });

    if (existing) {
      await tx.tournamentEntry.delete({ where: { id: existing.id } });
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { taken: { decrement: 1 } },
      });
      return;
    }

    if (tournament.taken >= tournament.seats) {
      throw new Error("Tournament is full.");
    }

    await tx.tournamentEntry.create({ data: { userId, tournamentId } });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { taken: { increment: 1 } },
    });
  });

  return listTournaments(sessionToken);
}
