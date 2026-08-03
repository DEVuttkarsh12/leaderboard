import type { Metadata } from "next";
import LeaderboardSection from "@/components/leaderboard-section";

export const metadata: Metadata = {
  title: "Leaderboard | RankBoard",
  description: "Read-only live leaderboard standings.",
};

export default function LeaderboardPage() {
  return <LeaderboardSection />;
}
