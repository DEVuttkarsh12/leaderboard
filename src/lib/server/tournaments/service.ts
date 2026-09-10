import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import { requireAdminUser } from "@/lib/server/admin/users";

export type TournamentMatchPayload = {
  id: string;
  round: number;
  position: number;
  participantA: string | null;
  participantB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  status: "Pending" | "Live" | "Completed";
};

export type TournamentPayload = {
  id: string;
  code: string;
  title: string;
  starts: string;
  prize: string;
  seats: number;
  taken: number;
  joined: boolean;
  status: "Open" | "Locked" | "Completed";
  active: boolean;
  entrants: string[];
  matches: TournamentMatchPayload[];
  updatedAt: string;
};

const DEFAULT_TOURNAMENTS = [
  { code: "friday-rush", title: "Friday Rush", starts: "Tonight 21:00", prize: "40K pts", seats: 64, taken: 0, sortOrder: 10 },
  { code: "duel-ladder", title: "Duel Ladder", starts: "Tomorrow 18:30", prize: "25K pts", seats: 32, taken: 0, sortOrder: 20 },
  { code: "season-finals", title: "Season Finals", starts: "Sunday 20:00", prize: "120K pts", seats: 16, taken: 0, sortOrder: 30 },
];

type TournamentStatus = "OPEN" | "LOCKED" | "COMPLETED";

type TournamentRecord = {
  id: string;
  code: string;
  title: string;
  starts: string;
  prize: string;
  seats: number;
  taken: number;
  status: TournamentStatus;
  active: boolean;
  updatedAt: Date;
  entries: Array<{
    userId: string;
    user: {
      name: string | null;
      email: string | null;
      displayName: string | null;
      discordUsername: string | null;
      kickUsername: string | null;
    };
  }>;
  matches: Array<{
    id: string;
    round: number;
    position: number;
    participantA: string | null;
    participantB: string | null;
    scoreA: number | null;
    scoreB: number | null;
    winner: string | null;
    status: string;
  }>;
};

const tournamentInclude = {
  entries: {
    include: {
      user: {
        select: {
          name: true,
          email: true,
          displayName: true,
          discordUsername: true,
          kickUsername: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  matches: {
    orderBy: [{ round: "asc" as const }, { position: "asc" as const }],
  },
};

function statusLabel(status: TournamentStatus): TournamentPayload["status"] {
  if (status === "OPEN") return "Open";
  if (status === "LOCKED") return "Locked";
  return "Completed";
}

function matchStatusLabel(status: string): TournamentMatchPayload["status"] {
  if (status === "LIVE") return "Live";
  if (status === "COMPLETED") return "Completed";
  return "Pending";
}

function entrantName(entry: TournamentRecord["entries"][number]) {
  const user = entry.user;
  const name = user.kickUsername ?? user.discordUsername ?? user.displayName ?? user.email?.split("@")[0] ?? user.name ?? "Player";
  return name.startsWith("@") ? name : `@${name}`;
}

function toPayload(tournament: TournamentRecord, userId?: string | null): TournamentPayload {
  return {
    id: tournament.id,
    code: tournament.code,
    title: tournament.title,
    starts: tournament.starts,
    prize: tournament.prize,
    seats: tournament.seats,
    taken: tournament.entries.length,
    joined: Boolean(userId && tournament.entries.some((entry) => entry.userId === userId)),
    status: statusLabel(tournament.status),
    active: tournament.active,
    entrants: tournament.entries.map(entrantName),
    matches: tournament.matches.map((match) => ({
      id: match.id,
      round: match.round,
      position: match.position,
      participantA: match.participantA,
      participantB: match.participantB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      winner: match.winner,
      status: matchStatusLabel(match.status),
    })),
    updatedAt: tournament.updatedAt.toISOString(),
  };
}

async function seedTournamentsIfEmpty() {
  const count = await prisma.tournament.count();
  if (count > 0) return;

  await prisma.tournament.createMany({
    data: DEFAULT_TOURNAMENTS.map((tournament) => ({
      ...tournament,
      status: "OPEN" as const,
      active: true,
    })),
  });
}

export async function listTournaments(sessionToken: string | undefined): Promise<TournamentPayload[]> {
  await seedTournamentsIfEmpty();
  const userId = await getSessionUserId(sessionToken);
  const tournaments = await prisma.tournament.findMany({
    where: { active: true },
    include: tournamentInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return (tournaments as TournamentRecord[]).map((tournament) => toPayload(tournament, userId));
}

export async function listAdminTournaments(sessionToken: string | undefined): Promise<TournamentPayload[]> {
  await requireAdminUser(sessionToken);
  await seedTournamentsIfEmpty();
  const tournaments = await prisma.tournament.findMany({
    include: tournamentInclude,
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return (tournaments as TournamentRecord[]).map((tournament) => toPayload(tournament));
}

export async function createTournament(
  sessionToken: string | undefined,
  input: { title: string; starts: string; prize: string; seats: number; participants: string[] }
) {
  await requireAdminUser(sessionToken);
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tournament";
  const tournament = await prisma.tournament.create({
    data: {
      code: `${slug}-${Date.now().toString(36)}`,
      title: input.title,
      starts: input.starts,
      prize: input.prize,
      seats: input.seats,
      status: "OPEN",
      active: true,
    },
  });

  if (input.participants.length >= 2) {
    await buildTournamentBracket(sessionToken, tournament.id, input.participants);
  }
  return getAdminTournament(sessionToken, tournament.id);
}

export async function updateTournament(
  sessionToken: string | undefined,
  tournamentId: string,
  input: Partial<{ title: string; starts: string; prize: string; seats: number; status: TournamentStatus; active: boolean }>
) {
  await requireAdminUser(sessionToken);
  await prisma.tournament.update({ where: { id: tournamentId }, data: input });
  return getAdminTournament(sessionToken, tournamentId);
}

function nextBracketSize(count: number) {
  let size = 2;
  while (size < count) size *= 2;
  return Math.min(size, 64);
}

export async function buildTournamentBracket(
  sessionToken: string | undefined,
  tournamentId: string,
  requestedParticipants: string[] = []
) {
  await requireAdminUser(sessionToken);
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, include: tournamentInclude });
  if (!tournament) throw new Error("Tournament not found.");

  const supplied = requestedParticipants.map((name) => name.trim()).filter(Boolean);
  const registered = (tournament as TournamentRecord).entries.map(entrantName);
  const participants = [...new Set((supplied.length ? supplied : registered).slice(0, 64))];
  if (participants.length < 2) throw new Error("Add at least two bracket participants.");

  const size = nextBracketSize(participants.length);
  const roundCount = Math.log2(size);
  const matches: Array<{
    tournamentId: string;
    round: number;
    position: number;
    participantA: string | null;
    participantB: string | null;
    winner: string | null;
    status: string;
  }> = [];

  for (let round = 0; round < roundCount; round += 1) {
    const matchCount = size / 2 ** (round + 1);
    for (let position = 0; position < matchCount; position += 1) {
      const participantA = round === 0 ? participants[position * 2] ?? null : null;
      const participantB = round === 0 ? participants[position * 2 + 1] ?? null : null;
      const winner = participantA && !participantB ? participantA : participantB && !participantA ? participantB : null;
      matches.push({ tournamentId, round, position, participantA, participantB, winner, status: winner ? "COMPLETED" : "PENDING" });
    }
  }

  for (let round = 0; round < roundCount - 1; round += 1) {
    for (const match of matches.filter((item) => item.round === round && item.winner)) {
      const next = matches.find((item) => item.round === round + 1 && item.position === Math.floor(match.position / 2));
      if (!next) continue;
      if (match.position % 2 === 0) next.participantA = match.winner;
      else next.participantB = match.winner;
    }
  }

  await prisma.$transaction([
    prisma.tournamentMatch.deleteMany({ where: { tournamentId } }),
    prisma.tournamentMatch.createMany({ data: matches }),
    prisma.tournament.update({ where: { id: tournamentId }, data: { status: "LOCKED" } }),
  ]);
  return getAdminTournament(sessionToken, tournamentId);
}

export async function updateTournamentMatch(
  sessionToken: string | undefined,
  tournamentId: string,
  matchId: string,
  input: Partial<{
    participantA: string | null;
    participantB: string | null;
    scoreA: number | null;
    scoreB: number | null;
    winner: string | null;
    status: "PENDING" | "LIVE" | "COMPLETED";
  }>
) {
  await requireAdminUser(sessionToken);
  const current = await prisma.tournamentMatch.findFirst({ where: { id: matchId, tournamentId } });
  if (!current) throw new Error("Tournament match not found.");

  const participantA = input.participantA === undefined ? current.participantA : input.participantA;
  const participantB = input.participantB === undefined ? current.participantB : input.participantB;
  if (input.winner && input.winner !== participantA && input.winner !== participantB) {
    throw new Error("Winner must be one of the match participants.");
  }

  const winner = input.winner === undefined ? current.winner : input.winner;
  const updated = await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { ...input, status: winner ? "COMPLETED" : input.status },
  });
  const nextMatch = await prisma.tournamentMatch.findUnique({
    where: { tournamentId_round_position: { tournamentId, round: current.round + 1, position: Math.floor(current.position / 2) } },
  });
  if (nextMatch) {
    await prisma.tournamentMatch.update({
      where: { id: nextMatch.id },
      data: current.position % 2 === 0 ? { participantA: winner } : { participantB: winner },
    });
  }

  return { updated, tournament: await getAdminTournament(sessionToken, tournamentId) };
}

async function getAdminTournament(sessionToken: string | undefined, tournamentId: string) {
  await requireAdminUser(sessionToken);
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, include: tournamentInclude });
  if (!tournament) throw new Error("Tournament not found.");
  return toPayload(tournament as TournamentRecord);
}

export async function toggleTournamentEntry(sessionToken: string | undefined, tournamentId: string): Promise<TournamentPayload[]> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to enter tournaments.");
  await seedTournamentsIfEmpty();

  await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findFirst({ where: { id: tournamentId, active: true } });
    if (!tournament) throw new Error("Tournament not found.");
    if (tournament.status !== "OPEN") throw new Error("Tournament is not open.");
    const existing = await tx.tournamentEntry.findUnique({ where: { userId_tournamentId: { userId, tournamentId } } });
    const actualTaken = await tx.tournamentEntry.count({ where: { tournamentId } });

    if (existing) {
      await tx.tournamentEntry.delete({ where: { id: existing.id } });
      await tx.tournament.update({ where: { id: tournamentId }, data: { taken: Math.max(0, actualTaken - 1) } });
      return;
    }
    if (actualTaken >= tournament.seats) throw new Error("Tournament is full.");
    await tx.tournamentEntry.create({ data: { userId, tournamentId } });
    await tx.tournament.update({ where: { id: tournamentId }, data: { taken: actualTaken + 1 } });
  });

  return listTournaments(sessionToken);
}
