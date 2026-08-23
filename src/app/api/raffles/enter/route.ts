import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { enterRaffle } from "@/lib/server/raffles/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { ticketCount?: unknown };
    const ticketCount =
      typeof body.ticketCount === "number" ? Math.floor(body.ticketCount) : 0;
    const raffle = await enterRaffle(sessionTokenFrom(request), ticketCount);

    return NextResponse.json({ raffle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Raffle entry failed.";
    const status =
      message === "Sign in to enter raffles." ? 401 :
      message === "Enter a valid ticket amount." ||
      message === "Raffle round is closed." ||
      message === "Not enough raffle tickets." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
