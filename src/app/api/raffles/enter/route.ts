import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { enterRaffle } from "@/lib/server/raffles/service";

export const runtime = "nodejs";

const entrySchema = z.object({
  ticketCount: z.number().int().positive().max(1_000_000),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = entrySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid ticket amount." }, { status: 400 });
    }
    const raffle = await enterRaffle(sessionTokenFrom(request), parsed.data.ticketCount);

    return NextResponse.json({ raffle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Raffle entry failed.";
    const status =
      message === "Sign in to enter raffles." ? 401 :
      message === "Enter a valid ticket amount." ||
      message === "Raffle round is closed." ||
      message === "Not enough raffle tickets." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Raffle entry could not be completed." : message },
      { status }
    );
  }
}
