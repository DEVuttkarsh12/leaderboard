import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminDrawRaffle } from "@/lib/server/raffles/service";

export const runtime = "nodejs";

const drawSchema = z.object({
  roundId: z.string().trim().min(1).max(128),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = drawSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid raffle round." }, { status: 400 });
    }

    const raffle = await adminDrawRaffle(sessionTokenFrom(request), parsed.data.roundId);
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
