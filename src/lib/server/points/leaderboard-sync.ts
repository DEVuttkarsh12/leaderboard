import { prisma } from "@/lib/server/db/prisma";
import { getLeaderboardRouteResult } from "@/lib/server/leaderboard/service";
import { syncPoints } from "./service";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";

export type SyncResult = {
  matched: number;
  skipped: number;
  errors: number;
};

/**
 * Matches leaderboard players to registered users by casino username,
 * then syncs their XP score as RankBoard points.
 */
export async function syncLeaderboardPoints(): Promise<SyncResult> {
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

  // Find all casino accounts
  const casinoAccounts = await prisma.casinoAccount.findMany({
    select: { userId: true, username: true, provider: true },
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
      await syncPoints(account.userId, score, "leaderboard_sync", {
        provider: account.provider,
        username: account.username,
      });
      matched++;
    } catch {
      errors++;
    }
  }

  return { matched, skipped, errors };
}
