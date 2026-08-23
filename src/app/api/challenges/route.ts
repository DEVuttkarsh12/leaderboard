import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { listChallengeMissions } from "@/lib/server/challenges/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const missions = await listChallengeMissions(sessionTokenFrom(request));
    return NextResponse.json({ missions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load missions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
