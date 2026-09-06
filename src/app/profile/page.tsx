import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Profile | ARTZ Rewards",
  description: "Player profile and linked account UI for ARTZ Rewards.",
};

export default function ProfilePage() {
  return <RankBoardApp route="profile" />;
}
