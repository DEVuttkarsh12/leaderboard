import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { getWatchSummary } from "@/lib/server/watch/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const summary = await getWatchSummary(sessionTokenFrom(request));
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watch points failed.";
    const status =
      message === "Sign in to view watch points." || message === "Session expired." ? 401 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
