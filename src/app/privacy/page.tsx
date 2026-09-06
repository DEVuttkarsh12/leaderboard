import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Privacy | ARTZ Rewards",
  description: "Privacy information for the rewards hub.",
};

export default function PrivacyPage() {
  return <RankBoardApp route="privacy" />;
}
