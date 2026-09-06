import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Custom Bets | ARTZ Rewards",
  description: "Prediction market UI for ARTZ Rewards point betting.",
};

export default function CustomBetsPage() {
  return <RankBoardApp route="custom-bets" />;
}
