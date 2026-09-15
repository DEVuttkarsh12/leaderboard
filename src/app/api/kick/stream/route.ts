import { NextResponse } from "next/server";
import { getPublicKickStream } from "@/lib/server/kick/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stream = await getPublicKickStream();
    return NextResponse.json({ stream });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kick stream state is unavailable.";
    const status = message === "KICK_WATCH_CHANNEL_SLUG is not configured." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
