import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { toggleTournamentEntry } from "@/lib/server/tournaments/service";

export const runtime = "nodejs";

const entrySchema = z.object({
  tournamentId: z.string().trim().min(1).max(128),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = entrySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid tournament." }, { status: 400 });
    }

    const tournaments = await toggleTournamentEntry(sessionTokenFrom(request), parsed.data.tournamentId);
    return NextResponse.json({ tournaments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tournament entry failed.";
    const status =
      message === "Sign in to enter tournaments." ? 401 :
      message === "Tournament not found." ||
      message === "Tournament is not open." ||
      message === "Tournament is full." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Tournament entry could not be updated." : message },
      { status }
    );
  }
}
