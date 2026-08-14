import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Watch Points | RankBoard",
  description: "Kick watch points UI for RankBoard.",
};

export default function WatchPointsPage() {
  return <RankBoardApp route="watch-points" />;
}
