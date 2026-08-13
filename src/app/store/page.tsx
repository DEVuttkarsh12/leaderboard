import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Store | RankBoard",
  description: "Reward store UI for the rewards hub.",
};

export default function StorePage() {
  return <RankBoardApp route="store" />;
}
