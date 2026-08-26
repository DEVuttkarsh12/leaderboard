import { NextResponse } from "next/server";
import { getLeaderboardRouteResult } from "@/lib/server/leaderboard/service";

export const runtime = "nodejs";

export async function GET() {
  const result = await getLeaderboardRouteResult();

  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}
