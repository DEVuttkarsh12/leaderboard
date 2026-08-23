import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { toggleTournamentEntry } from "@/lib/server/tournaments/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { tournamentId?: unknown };
    const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId.trim() : "";
    if (!tournamentId) {
      return NextResponse.json({ error: "tournamentId is required." }, { status: 400 });
    }

    const tournaments = await toggleTournamentEntry(sessionTokenFrom(request), tournamentId);
    return NextResponse.json({ tournaments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tournament entry failed.";
    const status =
      message === "Sign in to enter tournaments." ? 401 :
      message === "Tournament not found." ||
      message === "Tournament is not open." ||
      message === "Tournament is full." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
