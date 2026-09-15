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

export type AdminPointOperation = "add" | "deduct" | "set";

/** Admin: add, deduct, or set a user's spendable points and log the exact change. */
export async function adminAdjustPoints(
  userId: string,
  operation: AdminPointOperation,
  amount: number,
  adminId: string,
  note: string = ""
): Promise<number> {
  if (!Number.isInteger(amount) || amount < 0 || amount > 2_000_000_000) {
    throw new Error("Enter a whole-number amount from 0 to 2,000,000,000.");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new Error("Player not found.");

    const newPoints = operation === "set"
      ? amount
      : operation === "add"
        ? Math.min(2_000_000_000, user.points + amount)
        : Math.max(0, user.points - amount);
    const delta = newPoints - user.points;
    if (delta === 0) return user.points;

    const update = await tx.user.updateMany({
      where: { id: userId, points: user.points },
      data: { points: newPoints },
    });
    if (update.count !== 1) {
      throw new Error("The balance changed while saving. Refresh and try again.");
    }

    await tx.pointTransaction.create({
      data: {
        userId,
        amount: delta,
        reason: `admin_${operation}`,
        meta: JSON.stringify({
          adminId,
          operation,
          requestedAmount: amount,
          previousPoints: user.points,
          newPoints,
          note: note.trim().slice(0, 120),
        }),
      },
    });
    return newPoints;
  });
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
