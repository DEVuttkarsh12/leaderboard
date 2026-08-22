import { NextResponse } from "next/server";
import { getLeaderboardRouteResult } from "@/lib/server/leaderboard/service";
import { syncLeaderboardPoints } from "@/lib/server/points/leaderboard-sync";

export const runtime = "nodejs";

export async function GET() {
  const result = await getLeaderboardRouteResult();

  // Fire background points sync - don't await so we don't slow down leaderboard response
  if (result.status === 200) {
    syncLeaderboardPoints().catch(() => null);
  }

  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
