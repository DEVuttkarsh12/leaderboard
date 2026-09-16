import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import {
  createTournamentOnChallonge,
  linkTournamentToChallonge,
  unlinkTournamentChallonge,
} from "@/lib/server/tournaments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("link"), url: z.string().trim().min(1).max(200) }),
  z.object({
    action: z.literal("create"),
    name: z.string().trim().max(120).optional(),
    url: z.string().trim().max(120).optional(),
  }),
  z.object({ action: z.literal("unlink") }),
]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid Challonge action." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    const tournament =
      parsed.data.action === "link"
        ? await linkTournamentToChallonge(sessionToken, id, parsed.data.url)
        : parsed.data.action === "create"
          ? await createTournamentOnChallonge(sessionToken, id, { name: parsed.data.name, url: parsed.data.url })
          : await unlinkTournamentChallonge(sessionToken, id);

    return NextResponse.json({ tournament });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Challonge update failed.";
    return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 400 });
  }
}