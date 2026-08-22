import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, SESSION_COOKIE } from "@/lib/server/auth/session";
import { syncLeaderboardPoints } from "@/lib/server/points/leaderboard-sync";

export const dynamic = "force-dynamic";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  const account = await getSessionAccount(sessionTokenFrom(request));
  if (!account) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!account.badges.includes("Admin")) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  try {
    const result = await syncLeaderboardPoints();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
