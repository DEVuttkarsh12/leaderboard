import { randomInt } from "node:crypto";
import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import { requireAdminUser } from "@/lib/server/admin/users";

export type RaffleRoundPayload = {
  id: string;
  title: string;
  ticketRateWager: number;
  status: "Open" | "Drawing" | "Closed";
  totalEntries: number;
  winnerEntryId: string | null;
  drawnAt: string | null;
};

export type RaffleAccountPayload = {
  tickets: number;
  entries: number;
};

export type RaffleEntryPayload = {
  id: string;
  handle: string;
  ticketCount: number;
  createdAt: string;
};

export type RafflePayload = {
  round: RaffleRoundPayload;
  account: RaffleAccountPayload;
  entries: RaffleEntryPayload[];
};

const DEFAULT_ROUND = {
  title: "Weekly Wager Raffle",
  ticketRateWager: 10000,
  status: "OPEN" as const,
};

type RaffleStatus = "OPEN" | "DRAWING" | "CLOSED";

function statusLabel(status: RaffleStatus): RaffleRoundPayload["status"] {
  switch (status) {
    case "OPEN":
      return "Open";
    case "DRAWING":
      return "Drawing";
    case "CLOSED":
      return "Closed";
  }
}

function handleFromUser(user: {
  kickUsername: string | null;
  discordUsername: string | null;
  displayName: string | null;
  email: string | null;
  name: string | null;
}) {
  const handle =
    user.kickUsername ??
    user.discordUsername ??
    user.displayName?.replace(/^@/, "") ??
    user.email?.split("@")[0] ??
    user.name ??
    "player";

  return handle.startsWith("@") ? handle : `@${handle}`;
}

async function activeRound() {
  const existing = await prisma.raffleRound.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return prisma.raffleRound.create({ data: DEFAULT_ROUND });
}

async function rafflePayload(
  roundId: string,
  userId: string | null
): Promise<RafflePayload> {
  const [round, account, entries] = await Promise.all([
    prisma.raffleRound.findUniqueOrThrow({
      where: { id: roundId },
      include: { entries: { select: { ticketCount: true } } },
    }),
    userId
      ? prisma.raffleAccount.findUnique({
          where: { userId_roundId: { userId, roundId } },
        })
      : null,
    prisma.raffleEntry.findMany({
      where: { roundId },
      include: {
        user: {
          select: {
            kickUsername: true,
            discordUsername: true,
            displayName: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    round: {
      id: round.id,
      title: round.title,
      ticketRateWager: round.ticketRateWager,
      status: statusLabel(round.status),
      totalEntries: round.entries.reduce((sum, entry) => sum + entry.ticketCount, 0),
      winnerEntryId: round.winnerEntryId,
      drawnAt: round.drawnAt ? round.drawnAt.toISOString() : null,
    },
    account: {
      tickets: account?.tickets ?? 0,
      entries: account?.entries ?? 0,
    },
    entries: entries.map((entry) => ({
      id: entry.id,
      handle: handleFromUser(entry.user),
      ticketCount: entry.ticketCount,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function getCurrentRaffle(
  sessionToken: string | undefined
): Promise<RafflePayload> {
  const round = await activeRound();
  const userId = await getSessionUserId(sessionToken);
  return rafflePayload(round.id, userId);
}

export async function convertWagerToTickets(
  sessionToken: string | undefined,
  wagerAmount: number
): Promise<RafflePayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to convert raffle tickets.");
  if (!Number.isInteger(wagerAmount) || wagerAmount <= 0 || wagerAmount > 100_000_000) {
    throw new Error("Enter a valid wager amount.");
  }

  const round = await activeRound();
  if (round.status !== "OPEN") throw new Error("Raffle round is closed.");

  const generated = Math.floor(wagerAmount / round.ticketRateWager);
  if (generated <= 0) throw new Error("Wager amount does not generate a ticket.");

  await prisma.raffleAccount.upsert({
    where: { userId_roundId: { userId, roundId: round.id } },
    create: {
      userId,
      roundId: round.id,
      tickets: generated,
      entries: 0,
    },
    update: {
      tickets: { increment: generated },
    },
  });

  return rafflePayload(round.id, userId);
}

export async function enterRaffle(
  sessionToken: string | undefined,
  ticketCount: number
): Promise<RafflePayload> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to enter raffles.");
  if (!Number.isInteger(ticketCount) || ticketCount <= 0 || ticketCount > 1000) {
    throw new Error("Enter a valid ticket amount.");
  }

  const round = await activeRound();
  if (round.status !== "OPEN") throw new Error("Raffle round is closed.");

  await prisma.$transaction(async (tx) => {
    const account = await tx.raffleAccount.findUnique({
      where: { userId_roundId: { userId, roundId: round.id } },
    });
    if (!account || account.tickets < ticketCount) {
      throw new Error("Not enough raffle tickets.");
    }

    await tx.raffleAccount.update({
      where: { id: account.id },
      data: {
        tickets: { decrement: ticketCount },
        entries: { increment: ticketCount },
      },
    });

    await tx.raffleEntry.create({
      data: {
        userId,
        roundId: round.id,
        ticketCount,
      },
    });
  });

  return rafflePayload(round.id, userId);
}

export async function adminDrawRaffle(
  sessionToken: string | undefined,
  roundId: string
): Promise<RafflePayload & { winner: RaffleEntryPayload }> {
  await requireAdminUser(sessionToken);

  const userId = await getSessionUserId(sessionToken);
  let winnerId = "";

  await prisma.$transaction(async (tx) => {
    const round = await tx.raffleRound.findUnique({
      where: { id: roundId },
    });
    if (!round) throw new Error("Raffle round not found.");
    if (round.status !== "OPEN") throw new Error("Raffle round is not open.");

    const entries = await tx.raffleEntry.findMany({
      where: { roundId },
      orderBy: { createdAt: "asc" },
    });
    const totalTickets = entries.reduce((sum, entry) => sum + entry.ticketCount, 0);
    if (totalTickets <= 0) throw new Error("No raffle entries to draw.");

    let cursor = randomInt(totalTickets);
    const winner = entries.find((entry) => {
      cursor -= entry.ticketCount;
      return cursor < 0;
    }) ?? entries[entries.length - 1];

    winnerId = winner.id;

    await tx.raffleRound.update({
      where: { id: roundId },
      data: {
        status: "CLOSED",
        winnerEntryId: winner.id,
        drawnAt: new Date(),
      },
    });

    await tx.raffleRound.create({
      data: {
        title: DEFAULT_ROUND.title,
        ticketRateWager: round.ticketRateWager,
        status: "OPEN",
      },
    });
  });

  const payload = await rafflePayload(roundId, userId);
  const winner =
    payload.entries.find((entry) => entry.id === winnerId) ??
    await prisma.raffleEntry.findUnique({
      where: { id: winnerId },
      include: {
        user: {
          select: {
            kickUsername: true,
            discordUsername: true,
            displayName: true,
            email: true,
            name: true,
          },
        },
      },
    }).then((entry) =>
      entry
        ? {
            id: entry.id,
            handle: handleFromUser(entry.user),
            ticketCount: entry.ticketCount,
            createdAt: entry.createdAt.toISOString(),
          }
        : null
    );
  if (!winner) throw new Error("Winner could not be loaded.");

  return { ...payload, winner };
}
