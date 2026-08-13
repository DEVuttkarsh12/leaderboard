import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Tournaments | RankBoard",
  description: "Tournament pages for the rewards hub.",
};

export default function TournamentsPage() {
  return <RankBoardApp route="tournaments" />;
}
