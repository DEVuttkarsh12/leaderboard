import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { convertWagerToTickets } from "@/lib/server/raffles/service";

export const runtime = "nodejs";

const convertSchema = z.object({
  wagerAmount: z.number().int().positive().max(1_000_000_000),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = convertSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid wager amount." }, { status: 400 });
    }
    const raffle = await convertWagerToTickets(sessionTokenFrom(request), parsed.data.wagerAmount);

    return NextResponse.json({ raffle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket conversion failed.";
    const status =
      message === "Sign in to convert raffle tickets." ? 401 :
      message === "Enter a valid wager amount." ||
      message === "Raffle round is closed." ||
      message === "Wager amount does not generate a ticket." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Tickets could not be converted." : message },
      { status }
    );
  }
}
