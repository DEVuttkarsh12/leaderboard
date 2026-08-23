import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminSubscribeKickEvents } from "@/lib/server/kick/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const results = await adminSubscribeKickEvents(sessionTokenFrom(request));
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kick subscription failed.";
    const status =
      message === "Admin login required." ||
      message === "Admin access required." ? 403 :
      message === "KICK_WEBHOOK_URL is not configured." ||
      message === "Kick account is not connected." ||
      message === "Kick account must be reconnected." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
