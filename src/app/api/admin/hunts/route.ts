import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { createAdminHunt, listAdminHunts } from "@/lib/server/hunts/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const moneySchema = z.number().int().min(0).max(2_000_000_000);
const createHuntSchema = z.object({
  title: z.string().trim().min(1).max(100),
  host: z.string().trim().min(1).max(80),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED"]).default("SCHEDULED"),
  startsAt: z.string().datetime().nullable().default(null),
  startBankroll: moneySchema,
  currentBankroll: moneySchema,
  bonusCount: z.number().int().min(0).max(100_000),
  openedCount: z.number().int().min(0).max(100_000),
  totalPayout: moneySchema,
  bestMultiplier: z.number().min(0).max(1_000_000_000),
  sortOrder: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  active: z.boolean().default(true),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status = message === "Admin login required." || message === "Admin access required." ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await listAdminHunts(sessionTokenFrom(request)));
  } catch (error) {
    return errorResponse(error, "Hunts could not be loaded.");
  }
}

export async function POST(request: NextRequest) {
  const parsed = createHuntSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid bonus hunt details." }, { status: 400 });
  }

  try {
    const hunt = await createAdminHunt(sessionTokenFrom(request), {
      ...parsed.data,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
    });
    return NextResponse.json({ hunt });
  } catch (error) {
    return errorResponse(error, "Bonus hunt could not be created.");
  }
}
