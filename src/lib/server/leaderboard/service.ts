import { getCodeshibLeaderboard } from "./codeshib";
import type { LeaderboardRouteResult } from "./result";
import { getShuffleLeaderboard } from "./shuffle";

export type LeaderboardProvider = "codeshib" | "shuffle";

function getLeaderboardProvider(): LeaderboardProvider {
  const configured = process.env.LEADERBOARD_PROVIDER?.trim().toLowerCase();
  return configured === "shuffle" ? "shuffle" : "codeshib";
}

export async function getLeaderboardRouteResult(): Promise<LeaderboardRouteResult> {
  const provider = getLeaderboardProvider();

  if (provider === "shuffle") {
    return getShuffleLeaderboard();
  }

  return getCodeshibLeaderboard();
}

