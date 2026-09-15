import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { toggleHuntFollow } from "@/lib/server/hunts/service";

export const runtime = "nodejs";

const huntSchema = z.object({ huntId: z.string().trim().min(1).max(128) });

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = huntSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid hunt." }, { status: 400 });
    }

    const data = await toggleHuntFollow(sessionTokenFrom(request), parsed.data.huntId);
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
