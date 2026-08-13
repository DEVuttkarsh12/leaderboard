import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Bonus Hunts | RankBoard",
  description: "Bonus hunt stream pages for the rewards hub.",
};

export default function BonusHuntsPage() {
  return <RankBoardApp route="bonus-hunts" />;
}
