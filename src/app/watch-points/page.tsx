import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Watch Points | ARTZ Rewards",
  description: "Kick watch points UI for ARTZ Rewards.",
};

export default function WatchPointsPage() {
  return <RankBoardApp route="watch-points" />;
}
