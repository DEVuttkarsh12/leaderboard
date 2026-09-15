import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { recordWatchHeartbeat } from "@/lib/server/watch/service";

export const runtime = "nodejs";

const heartbeatSchema = z.object({ running: z.boolean() });

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = heartbeatSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Watch status is invalid. Refresh and try again." }, { status: 400 });
    }
    const summary = await recordWatchHeartbeat(
      sessionTokenFrom(request),
      parsed.data.running
    );

    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watch heartbeat failed.";
    const status =
      message === "Sign in to earn watch points." || message === "Session expired." ? 401 :
      message === "Connect Kick to earn watch points." ||
      message === "Send a Kick chat message to verify watch activity." ||
      message === "Kick stream is not marked live yet." ||
      message === "KICK_WATCH_CHANNEL_SLUG is not configured." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Watch points could not be updated." : message },
      { status }
    );
  }
}
