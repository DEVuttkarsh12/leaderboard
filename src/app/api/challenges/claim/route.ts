import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { claimChallengeMission } from "@/lib/server/challenges/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { missionId?: unknown };
    const missionId = typeof body.missionId === "string" ? body.missionId.trim() : "";

    if (!missionId) {
      return NextResponse.json({ error: "missionId is required." }, { status: 400 });
    }

    const result = await claimChallengeMission(sessionTokenFrom(request), missionId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission claim failed.";
    const status =
      message === "Sign in to claim missions." ? 401 :
      message === "Mission not found." ||
      message === "Mission already claimed." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
