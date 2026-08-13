import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Help | RankBoard",
  description: "Help center pages for the rewards hub.",
};

export default function HelpPage() {
  return <RankBoardApp route="help" />;
}
