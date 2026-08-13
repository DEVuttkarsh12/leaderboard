import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Support | RankBoard",
  description: "Support pages for the rewards hub.",
};

export default function SupportPage() {
  return <RankBoardApp route="support" />;
}
