import type { Metadata } from "next";
import RankBoardApp from "@/components/rankboard-app";

export const metadata: Metadata = {
  title: "Admin | RankBoard",
  description: "Admin control room for RankBoard.",
};

export default function AdminPage() {
  return <RankBoardApp route="admin" />;
}
