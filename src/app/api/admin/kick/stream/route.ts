import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import {
  getAdminKickStream,
  setAdminKickStream,
} from "@/lib/server/kick/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const streamSchema = z.object({
  isLive: z.boolean(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Kick stream update failed.";
  const status =
    message === "Admin login required." || message === "Admin access required." ? 403 :
    message === "KICK_WATCH_CHANNEL_SLUG is not configured." ? 400 :
    500;

  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const stream = await getAdminKickStream(sessionTokenFrom(request));
    return NextResponse.json({ stream });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const parsed = streamSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid stream state." }, { status: 400 });
  }

  try {
    const stream = await setAdminKickStream(
      sessionTokenFrom(request),
      parsed.data.isLive
    );
    return NextResponse.json({ stream });
  } catch (error) {
    return errorResponse(error);
  }
}
