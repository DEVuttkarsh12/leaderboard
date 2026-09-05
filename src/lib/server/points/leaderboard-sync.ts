import { prisma } from "@/lib/server/db/prisma";
import { getLeaderboardRouteResult } from "@/lib/server/leaderboard/service";
import { syncXp } from "./service";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";

export type SyncResult = {
  matched: number;
  skipped: number;
  errors: number;
};

let lastSyncTimestamp = 0;
let isSyncing = false;
const SYNC_DEBOUNCE_MS = 10_000;

/**
 * Matches leaderboard players to registered users by casino username,
 * then syncs their tracked wager rank score as XP.
 *
 * Spendable points are NEVER touched by sync — they only change via
 * earn/spend flows (missions, watch, bets, store). This keeps store
 * redemptions and bet losses from being silently credited back.
 */
export async function syncLeaderboardPoints(): Promise<SyncResult> {
  const now = Date.now();
  if (isSyncing || now - lastSyncTimestamp < SYNC_DEBOUNCE_MS) {
    return { matched: 0, skipped: 0, errors: 0 };
  }

  isSyncing = true;
  lastSyncTimestamp = now;

  try {
    const result = await getLeaderboardRouteResult();
    if (result.status !== 200 || "error" in result.body) {
      throw new Error("Leaderboard API unavailable during sync");
    }

    const body = result.body as { users?: NormalizedLeaderboardUser[] };
    const players = body.users ?? [];
    if (!players.length) return { matched: 0, skipped: 0, errors: 0 };

  // Build lookup: casinoUsername (lowercase) -> leaderboard score
  const scoreByUsername = new Map<string, number>();
  for (const player of players) {
    if (player.username) scoreByUsername.set(player.username.toLowerCase(), player.score);
    if (player.kickUsername) scoreByUsername.set(player.kickUsername.toLowerCase(), player.score);
  }

  // Find all verified casino accounts
  const casinoAccounts = await prisma.casinoAccount.findMany({
    where: { isVerified: true },
    select: { userId: true, username: true, provider: true, email: true },
  });

  let matched = 0;
  let skipped = 0;
  let errors = 0;
  const processedUserIds = new Set<string>();

  for (const account of casinoAccounts) {
    if (processedUserIds.has(account.userId)) continue;

    const score = scoreByUsername.get(account.username.toLowerCase());
    if (score === undefined) {
      skipped++;
      continue;
    }

    processedUserIds.add(account.userId);

    try {
      await syncXp(account.userId, score);
      matched++;
    } catch {
      errors++;
    }
  }

  return { matched, skipped, errors };
  } finally {
    isSyncing = false;
  }
}
