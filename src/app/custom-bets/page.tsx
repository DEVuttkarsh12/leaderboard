import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Custom Bets | RankBoard",
  description: "Prediction market UI for RankBoard point betting.",
};

export default function CustomBetsPage() {
  return <RankBoardApp route="custom-bets" />;
}
