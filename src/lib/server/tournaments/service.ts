import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import { requireAdminUser } from "@/lib/server/admin/users";
import type { Prisma } from "@/generated/prisma/client";
import { applyMatchUpdate, bracketChampion, createBracket, type MatchUpdate } from "@/lib/tournament-bracket";
import { randomUUID } from "node:crypto";
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

export async function listTournaments(sessionToken: string | undefined): Promise<TournamentPayload[]> {
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
  const tournaments = await prisma.tournament.findMany({
    include: tournamentInclude,
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return (tournaments as TournamentRecord[]).map((tournament) => toPayload(tournament));
}

// Every mutation takes the same tournament row lock, including registration.
// This serializes seat checks, bracket generation, scoring, and admin edits.
async function lockTournament(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Tournament" WHERE "id" = ${id} FOR UPDATE`;
  if (!rows.length) throw new Error("Tournament not found.");
}

async function readTournament(tx: Prisma.TransactionClient, id: string) {
  const record = await tx.tournament.findUniqueOrThrow({ where: { id }, include: tournamentInclude });
  return toPayload(record as TournamentRecord);
}

export async function createTournament(
  sessionToken: string | undefined,
  input: { title: string; starts: string; prize: string; seats: number; participants: string[] }
) {
  await requireAdminUser(sessionToken);
  const matches = input.participants.length ? createBracket(input.participants, input.seats) : [];
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tournament";
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({ data: {
      code: `${slug}-${randomUUID()}`,
      title: input.title, starts: input.starts, prize: input.prize, seats: input.seats,
      status: matches.length ? "LOCKED" : "OPEN", active: true,
      matches: { create: matches },
    } });
    return readTournament(tx, tournament.id);
  });
}

export async function updateTournament(
  sessionToken: string | undefined,
  tournamentId: string,
  input: Partial<{ title: string; starts: string; prize: string; seats: number; status: TournamentStatus; active: boolean }>
) {
  await requireAdminUser(sessionToken);
  return prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    const existing = await tx.tournament.findUniqueOrThrow({ where: { id: tournamentId }, include: tournamentInclude });
    const participants = existing.matches.filter((match) => match.round === 0).flatMap((match) => [match.participantA, match.participantB]).filter(Boolean).length;
    const minimum = Math.max(existing.entries.length, participants);
    if (input.seats !== undefined && input.seats < minimum) {
      throw new Error(`Seat limit cannot be lower than the ${minimum} registered or seeded players.`);
    }
    if (input.status === "OPEN" && existing.matches.length) {
      throw new Error("Reset the bracket before reopening registration.");
    }
    if (input.status === "COMPLETED" && !bracketChampion(existing.matches)) {
      throw new Error("Complete the final match to finish the tournament.");
    }
    if (input.status === "LOCKED" && bracketChampion(existing.matches)) {
      throw new Error("Reset the final result to resume this tournament.");
    }
    await tx.tournament.update({ where: { id: tournamentId }, data: input });
    return readTournament(tx, tournamentId);
  });
}

export async function buildTournamentBracket(
  sessionToken: string | undefined,
  tournamentId: string,
  requestedParticipants: string[] = []
) {
  await requireAdminUser(sessionToken);
  return prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    const tournament = await tx.tournament.findUniqueOrThrow({ where: { id: tournamentId }, include: tournamentInclude });
    if (tournament.matches.length) throw new Error("Reset the existing bracket before generating a new one.");
    const registered = (tournament as TournamentRecord).entries.map(entrantName);
    const matches = createBracket(requestedParticipants.length ? requestedParticipants : registered, tournament.seats);
    await tx.tournamentMatch.createMany({ data: matches.map((match) => ({ ...match, tournamentId })) });
    await tx.tournament.update({ where: { id: tournamentId }, data: { status: "LOCKED" } });
    return readTournament(tx, tournamentId);
  });
}

export async function resetTournamentBracket(sessionToken: string | undefined, tournamentId: string) {
  await requireAdminUser(sessionToken);
  return prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    await tx.tournamentMatch.deleteMany({ where: { tournamentId } });
    await tx.tournament.update({ where: { id: tournamentId }, data: { status: "OPEN" } });
    return readTournament(tx, tournamentId);
  });
}

export async function updateTournamentMatch(
  sessionToken: string | undefined,
  tournamentId: string,
  matchId: string,
  input: MatchUpdate
) {
  await requireAdminUser(sessionToken);
  return prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    const matches = await tx.tournamentMatch.findMany({ where: { tournamentId }, orderBy: [{ round: "asc" }, { position: "asc" }] });
    const current = matches.find((match) => match.id === matchId);
    if (!current) throw new Error("Tournament match not found.");
    const next = applyMatchUpdate(matches, current.round, current.position, input);
    for (const match of next) {
      const previous = matches.find((item) => item.id === match.id)!;
      const data = { participantA: match.participantA, participantB: match.participantB, scoreA: match.scoreA, scoreB: match.scoreB, winner: match.winner, status: match.status };
      if (Object.entries(data).some(([key, value]) => previous[key as keyof typeof data] !== value)) {
        await tx.tournamentMatch.update({ where: { id: match.id }, data });
      }
    }
    await tx.tournament.update({ where: { id: tournamentId }, data: { status: bracketChampion(next) ? "COMPLETED" : "LOCKED" } });
    return { tournament: await readTournament(tx, tournamentId) };
  }, { timeout: 15_000 });
}

export async function toggleTournamentEntry(sessionToken: string | undefined, tournamentId: string): Promise<TournamentPayload[]> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to enter tournaments.");
  await prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    const tournament = await tx.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
    if (!tournament.active) throw new Error("Tournament not found.");
    if (tournament.status !== "OPEN") throw new Error("Tournament is not open.");
    const existing = await tx.tournamentEntry.findUnique({ where: { userId_tournamentId: { userId, tournamentId } } });
    const taken = await tx.tournamentEntry.count({ where: { tournamentId } });
    if (existing) {
      await tx.tournamentEntry.delete({ where: { id: existing.id } });
      await tx.tournament.update({ where: { id: tournamentId }, data: { taken: taken - 1 } });
    } else {
      if (taken >= tournament.seats) throw new Error("Tournament is full.");
      await tx.tournamentEntry.create({ data: { userId, tournamentId } });
      await tx.tournament.update({ where: { id: tournamentId }, data: { taken: taken + 1 } });
    }
  });
  return listTournaments(sessionToken);
}
