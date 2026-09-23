import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Bonus Hunts | ARTZ Rewards",
  description: "Follow live bonus hunts and catch the biggest hits.",
};

export default function BonusHuntsPage() {
  return <RankBoardApp route="bonus-hunts" />;
}
