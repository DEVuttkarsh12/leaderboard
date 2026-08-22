import { prisma } from "@/lib/server/db/prisma";
import { getSessionAccount, getSessionUserId } from "@/lib/server/auth/session";

export type BetMarketPayload = {
  id: string;
  title: string;
  type: string;
  deadline: string;
  status: "Live" | "Locked" | "Settled" | "Cancelled";
  sides: [string, string];
  odds: [number, number];
  winner: string | null;
  createdAt: string;
};

export type UserBetPayload = {
  id: string;
  marketId: string;
  marketTitle: string;
  side: string;
  amount: number;
  odds: number;
  potentialPayout: number;
  payout: number;
  status: "Open" | "Won" | "Lost" | "Refunded";
  createdAt: string;
};

const DEFAULT_MARKETS = [
  {
    title: "Max Win Today?",
    type: "Stream",
    deadline: "22:00",
    sideA: "Yes",
    sideB: "No",
    oddsA: 2.4,
    oddsB: 1.35,
    status: "LIVE" as const,
  },
  {
    title: "UFC Main Event",
    type: "UFC",
    deadline: "23:30",
    sideA: "Islam",
    sideB: "Conor",
    oddsA: 2.0,
    oddsB: 1.3,
    status: "LIVE" as const,
  },
  {
    title: "Level 100 Run",
    type: "Casino",
    deadline: "01:00",
    sideA: "Hits",
    sideB: "Misses",
    oddsA: 1.8,
    oddsB: 1.7,
    status: "LOCKED" as const,
  },
];

async function seedMarketsIfEmpty(): Promise<void> {
  const count = await prisma.betMarket.count();
  if (count > 0) return;
  await prisma.betMarket.createMany({
    data: DEFAULT_MARKETS,
  });
}

function formatStatus(status: "LIVE" | "LOCKED" | "SETTLED" | "CANCELLED"): "Live" | "Locked" | "Settled" | "Cancelled" {
  switch (status) {
    case "LIVE":
      return "Live";
    case "LOCKED":
      return "Locked";
    case "SETTLED":
      return "Settled";
    case "CANCELLED":
      return "Cancelled";
  }
}

function formatBetStatus(status: "OPEN" | "WON" | "LOST" | "REFUNDED"): "Open" | "Won" | "Lost" | "Refunded" {
  switch (status) {
    case "OPEN":
      return "Open";
    case "WON":
      return "Won";
    case "LOST":
      return "Lost";
    case "REFUNDED":
      return "Refunded";
  }
}

export async function listBetMarkets(): Promise<BetMarketPayload[]> {
  await seedMarketsIfEmpty();
  const markets = await prisma.betMarket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return markets.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    deadline: m.deadline,
    status: formatStatus(m.status),
    sides: [m.sideA, m.sideB],
    odds: [m.oddsA, m.oddsB],
    winner: m.winner,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function placeBet(
  sessionToken: string | undefined,
  marketId: string,
  side: string,
  amount: number
): Promise<{ bet: UserBetPayload; newPoints: number }> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to place bets.");

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Enter a valid bet amount.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const market = await tx.betMarket.findUnique({ where: { id: marketId } });
    if (!market || market.status !== "LIVE") {
      throw new Error("This betting market is not open for bets.");
    }

    let odds = 0;
    if (side === market.sideA) {
      odds = market.oddsA;
    } else if (side === market.sideB) {
      odds = market.oddsB;
    } else {
      throw new Error("Invalid side chosen.");
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new Error("User session expired.");
    if (user.points < amount) throw new Error("Not enough points.");

    const potentialPayout = Math.floor(amount * odds);

    const [updatedUser, bet] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
        select: { points: true },
      }),
      tx.userBet.create({
        data: {
          userId,
          marketId,
          side,
          amount,
          odds,
          potentialPayout,
          status: "OPEN",
        },
        include: { market: { select: { title: true } } },
      }),
      tx.pointTransaction.create({
        data: {
          userId,
          amount: -amount,
          reason: "bet_placed",
          meta: JSON.stringify({ marketId, marketTitle: market.title, side, odds }),
        },
      }),
    ]);

    return { updatedUser, bet };
  });

  return {
    bet: {
      id: result.bet.id,
      marketId: result.bet.marketId,
      marketTitle: result.bet.market.title,
      side: result.bet.side,
      amount: result.bet.amount,
      odds: result.bet.odds,
      potentialPayout: result.bet.potentialPayout,
      payout: result.bet.payout,
      status: "Open",
      createdAt: result.bet.createdAt.toISOString(),
    },
    newPoints: result.updatedUser.points,
  };
}

export async function listUserBets(sessionToken: string | undefined): Promise<UserBetPayload[]> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) return [];

  const bets = await prisma.userBet.findMany({
    where: { userId },
    include: { market: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return bets.map((b) => ({
    id: b.id,
    marketId: b.marketId,
    marketTitle: b.market.title,
    side: b.side,
    amount: b.amount,
    odds: b.odds,
    potentialPayout: b.potentialPayout,
    payout: b.payout,
    status: formatBetStatus(b.status),
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function adminCreateMarket(
  sessionToken: string | undefined,
  data: {
    title: string;
    type?: string;
    deadline?: string;
    sideA: string;
    sideB: string;
    oddsA: number;
    oddsB: number;
  }
): Promise<BetMarketPayload> {
  const account = await getSessionAccount(sessionToken);
  if (!account?.badges.includes("Admin")) {
    throw new Error("Admin access required.");
  }

  const market = await prisma.betMarket.create({
    data: {
      title: data.title.trim(),
      type: data.type?.trim() || "Stream",
      deadline: data.deadline?.trim() || "23:59",
      sideA: data.sideA.trim(),
      sideB: data.sideB.trim(),
      oddsA: Math.max(1.01, data.oddsA),
      oddsB: Math.max(1.01, data.oddsB),
      status: "LIVE",
    },
  });

  return {
    id: market.id,
    title: market.title,
    type: market.type,
    deadline: market.deadline,
    status: "Live",
    sides: [market.sideA, market.sideB],
    odds: [market.oddsA, market.oddsB],
    winner: null,
    createdAt: market.createdAt.toISOString(),
  };
}

export async function adminSettleMarket(
  sessionToken: string | undefined,
  marketId: string,
  winningSide: string
): Promise<{ settledBets: number; winnersPaid: number; totalPointsPaid: number }> {
  const account = await getSessionAccount(sessionToken);
  if (!account?.badges.includes("Admin")) {
    throw new Error("Admin access required.");
  }

  return prisma.$transaction(async (tx) => {
    const market = await tx.betMarket.findUnique({ where: { id: marketId } });
    if (!market) throw new Error("Market not found.");
    if (market.status === "SETTLED") throw new Error("Market already settled.");
    if (winningSide !== market.sideA && winningSide !== market.sideB) {
      throw new Error("Winner must be side A or side B.");
    }

    await tx.betMarket.update({
      where: { id: marketId },
      data: {
        status: "SETTLED",
        winner: winningSide,
        settledAt: new Date(),
      },
    });

    const openBets = await tx.userBet.findMany({
      where: { marketId, status: "OPEN" },
    });

    let winnersPaid = 0;
    let totalPointsPaid = 0;

    for (const bet of openBets) {
      if (bet.side === winningSide) {
        winnersPaid++;
        totalPointsPaid += bet.potentialPayout;

        await tx.userBet.update({
          where: { id: bet.id },
          data: {
            status: "WON",
            payout: bet.potentialPayout,
          },
        });

        await tx.user.update({
          where: { id: bet.userId },
          data: { points: { increment: bet.potentialPayout } },
        });

        await tx.pointTransaction.create({
          data: {
            userId: bet.userId,
            amount: bet.potentialPayout,
            reason: "bet_won",
            meta: JSON.stringify({
              marketId,
              marketTitle: market.title,
              winningSide,
              betAmount: bet.amount,
              odds: bet.odds,
            }),
          },
        });
      } else {
        await tx.userBet.update({
          where: { id: bet.id },
          data: {
            status: "LOST",
            payout: 0,
          },
        });
      }
    }

    return {
      settledBets: openBets.length,
      winnersPaid,
      totalPointsPaid,
    };
  });
}

export async function adminCancelMarket(
  sessionToken: string | undefined,
  marketId: string
): Promise<{ refundedBets: number; totalRefunded: number }> {
  const account = await getSessionAccount(sessionToken);
  if (!account?.badges.includes("Admin")) {
    throw new Error("Admin access required.");
  }

  return prisma.$transaction(async (tx) => {
    const market = await tx.betMarket.findUnique({ where: { id: marketId } });
    if (!market) throw new Error("Market not found.");
    if (market.status === "SETTLED" || market.status === "CANCELLED") {
      throw new Error("Market already resolved.");
    }

    await tx.betMarket.update({
      where: { id: marketId },
      data: { status: "CANCELLED", settledAt: new Date() },
    });

    const openBets = await tx.userBet.findMany({
      where: { marketId, status: "OPEN" },
    });

    let totalRefunded = 0;

    for (const bet of openBets) {
      totalRefunded += bet.amount;

      await tx.userBet.update({
        where: { id: bet.id },
        data: { status: "REFUNDED", payout: bet.amount },
      });

      await tx.user.update({
        where: { id: bet.userId },
        data: { points: { increment: bet.amount } },
      });

      await tx.pointTransaction.create({
        data: {
          userId: bet.userId,
          amount: bet.amount,
          reason: "bet_refunded",
          meta: JSON.stringify({
            marketId,
            marketTitle: market.title,
          }),
        },
      });
    }

    return {
      refundedBets: openBets.length,
      totalRefunded,
    };
  });
}
