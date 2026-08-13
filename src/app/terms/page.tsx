import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Terms | RankBoard",
  description: "Terms information for the rewards hub.",
};

export default function TermsPage() {
  return <RankBoardApp route="terms" />;
}
