import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminDrawRaffle } from "@/lib/server/raffles/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { roundId?: unknown };
    const roundId = typeof body.roundId === "string" ? body.roundId.trim() : "";
    if (!roundId) {
      return NextResponse.json({ error: "roundId is required." }, { status: 400 });
    }

    const raffle = await adminDrawRaffle(sessionTokenFrom(request), roundId);
    return NextResponse.json({ raffle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Raffle draw failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      message === "Raffle round not found." ? 404 :
      message === "Raffle round is not open." ||
      message === "No raffle entries to draw." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
