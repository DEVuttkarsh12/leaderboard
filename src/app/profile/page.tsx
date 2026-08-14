import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Profile | RankBoard",
  description: "Player profile and linked account UI for RankBoard.",
};

export default function ProfilePage() {
  return <RankBoardApp route="profile" />;
}
