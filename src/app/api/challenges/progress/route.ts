import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { advanceChallengeProgress } from "@/lib/server/challenges/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      missionId?: unknown;
      amount?: unknown;
    };
    const missionId = typeof body.missionId === "string" ? body.missionId.trim() : "";
    const amount = typeof body.amount === "number" ? Math.floor(body.amount) : 25;

    if (!missionId) {
      return NextResponse.json({ error: "missionId is required." }, { status: 400 });
    }

    const mission = await advanceChallengeProgress(
      sessionTokenFrom(request),
      missionId,
      amount
    );

    return NextResponse.json({ mission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission progress failed.";
    const status =
      message === "Sign in to progress missions." ? 401 :
      message === "Mission not found." || message === "Enter a valid progress amount." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
