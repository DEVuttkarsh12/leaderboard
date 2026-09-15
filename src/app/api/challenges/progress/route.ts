import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { advanceChallengeProgress } from "@/lib/server/challenges/service";
import { requireAdminUser } from "@/lib/server/admin/users";

export const runtime = "nodejs";

const progressSchema = z.object({
  missionId: z.string().trim().min(1).max(128),
  amount: z.number().int().min(1).max(10_000).default(25),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser(sessionTokenFrom(request));
    const parsed = progressSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a mission and a valid progress amount." }, { status: 400 });
    }

    const mission = await advanceChallengeProgress(
      sessionTokenFrom(request),
      parsed.data.missionId,
      parsed.data.amount
    );

    return NextResponse.json({ mission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission progress failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      message === "Sign in to progress missions." ? 401 :
      message === "Mission not found." || message === "Enter a valid progress amount." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Mission progress could not be updated." : message },
      { status }
    );
  }
}
