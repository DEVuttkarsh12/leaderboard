import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RankBoardApp from "@/components/rankboard-app";
import { getSessionAccount, SESSION_COOKIE } from "@/lib/server/auth/session";

export const metadata: Metadata = {
  title: "Admin | RankBoard",
  description: "Admin control room for RankBoard.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const cookieStore = await cookies();
  const account = await getSessionAccount(cookieStore.get(SESSION_COOKIE)?.value);

  if (!account) {
    redirect("/login");
  }

  if (!account.badges.includes("Admin")) {
    redirect("/profile");
  }

  return <RankBoardApp route="admin" />;
}
