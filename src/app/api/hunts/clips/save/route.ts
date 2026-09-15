import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { toggleHuntClipSave } from "@/lib/server/hunts/service";

export const runtime = "nodejs";

const clipSchema = z.object({ clipId: z.string().trim().min(1).max(128) });

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = clipSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid clip." }, { status: 400 });
    }

    const data = await toggleHuntClipSave(sessionTokenFrom(request), parsed.data.clipId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Clip save failed.";
    const status =
      message === "Sign in to save clips." ? 401 :
      message === "Clip not found." ? 404 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
