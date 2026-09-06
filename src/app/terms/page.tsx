import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Terms | ARTZ Rewards",
  description: "Terms information for the rewards hub.",
};

export default function TermsPage() {
  return <RankBoardApp route="terms" />;
}
