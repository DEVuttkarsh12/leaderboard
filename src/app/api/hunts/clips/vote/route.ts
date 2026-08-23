import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { voteHuntClip } from "@/lib/server/hunts/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { clipId?: unknown };
    const clipId = typeof body.clipId === "string" ? body.clipId.trim() : "";
    if (!clipId) {
      return NextResponse.json({ error: "clipId is required." }, { status: 400 });
    }

    const data = await voteHuntClip(sessionTokenFrom(request), clipId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Clip vote failed.";
    const status =
      message === "Sign in to vote on clips." ? 401 :
      message === "Clip not found." ? 404 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
