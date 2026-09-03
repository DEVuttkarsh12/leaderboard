import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import {
  adminCreateChallengeMission,
  listAdminChallengeMissions,
} from "@/lib/server/challenges/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cadenceSchema = z.enum(["DAILY", "WEEKLY", "MILESTONE", "SEASONAL"]);
const createChallengeSchema = z.object({
  slotName: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(100),
  multiplier: z.number().int().min(1).max(100_000),
  reward: z.number().int().min(0).max(100_000_000),
  cadence: cadenceSchema.default("MILESTONE"),
  active: z.boolean().default(true),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const missions = await listAdminChallengeMissions(sessionTokenFrom(request));
    return NextResponse.json({ missions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission load failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const parsed = createChallengeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid challenge details." }, { status: 400 });
  }

  try {
    const mission = await adminCreateChallengeMission(sessionTokenFrom(request), parsed.data);
    return NextResponse.json({ mission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mission publish failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      400;
    return NextResponse.json({ error: message }, { status });
  }
}
