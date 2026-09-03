import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminUpdateChallengeMission } from "@/lib/server/challenges/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cadenceSchema = z.enum(["DAILY", "WEEKLY", "MILESTONE", "SEASONAL"]);
const updateChallengeSchema = z.object({
  slotName: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(100).optional(),
  multiplier: z.number().int().min(1).max(100_000).optional(),
  reward: z.number().int().min(0).max(100_000_000).optional(),
  cadence: cadenceSchema.optional(),
  active: z.boolean().optional(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = updateChallengeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid challenge updates." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const mission = await adminUpdateChallengeMission(
      sessionTokenFrom(request),
      id,
      parsed.data
    );
    return NextResponse.json({ mission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission update failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      400;
    return NextResponse.json({ error: message }, { status });
  }
}
