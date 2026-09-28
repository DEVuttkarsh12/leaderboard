import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { updateAdminHunt } from "@/lib/server/hunts/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const moneySchema = z.number().int().min(0).max(2_000_000_000);
const updateHuntSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  host: z.string().trim().min(1).max(80).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED"]).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  startBankroll: moneySchema.optional(),
  currentBankroll: moneySchema.optional(),
  bonusCount: z.number().int().min(0).max(100_000).optional(),
  openedCount: z.number().int().min(0).max(100_000).optional(),
  totalPayout: moneySchema.optional(),
  bestMultiplier: z.number().min(0).max(1_000_000_000).optional(),
  sortOrder: z.number().int().min(-1_000_000).max(1_000_000).optional(),
  active: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one hunt update.");

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Bonus hunt update failed.";
  const status = message === "Admin login required." || message === "Admin access required." ? 403 : message === "Hunt not found." ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = updateHuntSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid bonus hunt updates." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const patch = {
      ...parsed.data,
      ...(parsed.data.startsAt !== undefined
        ? { startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null }
        : {}),
    };
    const hunt = await updateAdminHunt(request.cookies.get(SESSION_COOKIE)?.value, id, patch);
    return NextResponse.json({ hunt });
  } catch (error) {
    return errorResponse(error);
  }
}
