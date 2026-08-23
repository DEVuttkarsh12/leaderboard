import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { toggleHuntFollow } from "@/lib/server/hunts/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { huntId?: unknown };
    const huntId = typeof body.huntId === "string" ? body.huntId.trim() : "";
    if (!huntId) {
      return NextResponse.json({ error: "huntId is required." }, { status: 400 });
    }

    const data = await toggleHuntFollow(sessionTokenFrom(request), huntId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Follow failed.";
    const status =
      message === "Sign in to follow hunts." ? 401 :
      message === "Hunt not found." ? 404 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
