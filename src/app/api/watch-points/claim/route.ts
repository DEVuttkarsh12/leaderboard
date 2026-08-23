import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { claimWatchPoints } from "@/lib/server/watch/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const summary = await claimWatchPoints(sessionTokenFrom(request));
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watch claim failed.";
    const status =
      message === "Sign in to earn watch points." || message === "Session expired." ? 401 :
      message === "Connect Kick to earn watch points." ||
      message === "No watch points are ready to claim." ||
      message === "Send a Kick chat message to verify watch activity." ||
      message === "Kick stream is not marked live yet." ||
      message === "KICK_WATCH_CHANNEL_SLUG is not configured." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
