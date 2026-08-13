import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Wager Raffles | RankBoard",
  description: "Raffle and ticket UI for the rewards hub.",
};

export default function WagerRafflesPage() {
  return <RankBoardApp route="wager-raffles" />;
}
