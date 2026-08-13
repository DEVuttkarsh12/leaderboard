import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Login | RankBoard",
  description: "Authentication entry page for the rewards hub.",
};

export default function LoginPage() {
  return <RankBoardApp route="login" />;
}
