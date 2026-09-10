import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { updateTournament } from "@/lib/server/tournaments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  starts: z.string().trim().min(1).max(100).optional(),
  prize: z.string().trim().min(1).max(80).optional(),
  seats: z.number().int().min(2).max(64).optional(),
  status: z.enum(["OPEN", "LOCKED", "COMPLETED"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid tournament updates." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const tournament = await updateTournament(request.cookies.get(SESSION_COOKIE)?.value, id, parsed.data);
    return NextResponse.json({ tournament });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tournament update failed.";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 400 });
  }
}
