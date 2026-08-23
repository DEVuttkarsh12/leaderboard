import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { convertWagerToTickets } from "@/lib/server/raffles/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { wagerAmount?: unknown };
    const wagerAmount =
      typeof body.wagerAmount === "number" ? Math.floor(body.wagerAmount) : 0;
    const raffle = await convertWagerToTickets(sessionTokenFrom(request), wagerAmount);

    return NextResponse.json({ raffle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket conversion failed.";
    const status =
      message === "Sign in to convert raffle tickets." ? 401 :
      message === "Enter a valid wager amount." ||
      message === "Raffle round is closed." ||
      message === "Wager amount does not generate a ticket." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
