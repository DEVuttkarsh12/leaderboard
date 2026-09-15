import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { claimChallengeMission } from "@/lib/server/challenges/service";

export const runtime = "nodejs";

const claimSchema = z.object({
  missionId: z.string().trim().min(1).max(128),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = claimSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid mission." }, { status: 400 });
    }

    const result = await claimChallengeMission(sessionTokenFrom(request), parsed.data.missionId);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission claim failed.";
    const status =
      message === "Sign in to claim missions." ? 401 :
      message === "Mission not found." ||
      message === "Mission already claimed." ||
      message === "Mission is not complete yet." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Mission could not be claimed." : message },
      { status }
    );
  }
}
