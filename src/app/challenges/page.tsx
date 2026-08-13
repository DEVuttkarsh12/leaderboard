import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Challenges | RankBoard",
  description: "Campaign and challenge UI for the rewards hub.",
};

export default function ChallengesPage() {
  return <RankBoardApp route="challenges" />;
}
