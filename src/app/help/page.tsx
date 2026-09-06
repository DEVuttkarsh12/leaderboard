import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Help | ARTZ Rewards",
  description: "Help center pages for the rewards hub.",
};

export default function HelpPage() {
  return <RankBoardApp route="help" />;
}
