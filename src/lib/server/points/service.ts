import { prisma } from "@/lib/server/db/prisma";

export type PointsTransactionPayload = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

/** Award points to a user (atomic, logged). Returns new balance. */
export async function earnPoints(
  userId: string,
  amount: number,
  reason: string,
  meta: Record<string, unknown> = {}
): Promise<number> {
  if (amount <= 0) throw new Error("earn amount must be positive");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: amount } },
      select: { points: true },
    });
    await tx.pointTransaction.create({
      data: { userId, amount, reason, meta: JSON.stringify(meta) },
    });
    return updated.points;
  });
}

/** Deduct points from a user (atomic, logged). Returns new balance. Throws if insufficient. */
export async function spendPoints(
  userId: string,
  amount: number,
  reason: string,
  meta: Record<string, unknown> = {}
): Promise<number> {
  if (amount <= 0) throw new Error("spend amount must be positive");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new Error("User not found.");
    if (user.points < amount) throw new Error("Not enough points.");

    const updated = await tx.user.update({
      where: { id: userId },
      data: { points: { decrement: amount } },
      select: { points: true },
    });
    await tx.pointTransaction.create({
      data: { userId, amount: -amount, reason, meta: JSON.stringify(meta) },
    });
    return updated.points;
  });
}

/**
 * Set a user's points to a specific value (used for leaderboard sync).
 * Only logs a transaction if the value actually changed.
 * Returns new balance.
 */
export async function syncPoints(
  userId: string,
  newPoints: number,
  reason: string = "leaderboard_sync",
  meta: Record<string, unknown> = {}
): Promise<number> {
  if (newPoints < 0) newPoints = 0;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new Error("User not found.");

    const delta = newPoints - user.points;
    if (delta === 0) return user.points;

    const updated = await tx.user.update({
      where: { id: userId },
      data: { points: newPoints },
      select: { points: true },
    });
    await tx.pointTransaction.create({
      data: { userId, amount: delta, reason, meta: JSON.stringify(meta) },
    });
    return updated.points;
  });
}

/** Admin: set a user's points to a specific value and log it. */
export async function adminSetPoints(
  userId: string,
  newPoints: number,
  adminId: string
): Promise<number> {
  return syncPoints(userId, newPoints, "admin_grant", { adminId });
}

/** Get last N point transactions for a user. */
export async function getUserTransactions(
  userId: string,
  take: number = 20
): Promise<PointsTransactionPayload[]> {
  const rows = await prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
  }));
}
