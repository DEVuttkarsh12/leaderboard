import type { Metadata } from "next";
import LeaderboardSection from "@/components/leaderboard-section";
import { getShuffleLeaderboardWindow } from "@/lib/server/leaderboard/shuffle-window";

export const metadata: Metadata = {
  title: "Leaderboard | RankBoard",
  description: "Read-only live leaderboard standings.",
};

function getCountdownTarget(): string | null {
  if (process.env.LEADERBOARD_PROVIDER !== "shuffle") {
    return null;
  }

  try {
    const { endIso } = getShuffleLeaderboardWindow();
    return endIso;
  } catch {
    return null;
  }
}

export default function LeaderboardPage() {
  return <LeaderboardSection countdownTarget={getCountdownTarget()} />;
}
