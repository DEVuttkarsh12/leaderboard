import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { updateTournamentMatch } from "@/lib/server/tournaments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const nullableName = z.string().trim().max(80).nullable();
const nullableScore = z.number().int().min(0).max(1_000_000).nullable();
const matchSchema = z.object({
  participantA: nullableName.optional(),
  participantB: nullableName.optional(),
  scoreA: nullableScore.optional(),
  scoreB: nullableScore.optional(),
  winner: nullableName.optional(),
  status: z.enum(["PENDING", "LIVE", "COMPLETED"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; matchId: string }> }
) {
  const parsed = matchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid match updates." }, { status: 400 });
  }

  try {
    const { id, matchId } = await context.params;
    const result = await updateTournamentMatch(request.cookies.get(SESSION_COOKIE)?.value, id, matchId, parsed.data);
    return NextResponse.json({ tournament: result.tournament });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Match update failed.";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 400 });
  }
}
