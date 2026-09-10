import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { buildTournamentBracket } from "@/lib/server/tournaments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bracketSchema = z.object({
  participants: z.array(z.string().trim().min(1).max(80)).max(64).default([]),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = bracketSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid bracket participants." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const tournament = await buildTournamentBracket(request.cookies.get(SESSION_COOKIE)?.value, id, parsed.data.participants);
    return NextResponse.json({ tournament });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bracket creation failed.";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 400 });
  }
}
