import { NextRequest, NextResponse } from "next/server";
import { placeBet } from "@/lib/server/bets/service";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const betSchema = z.object({
  marketId: z.string().min(1),
  side: z.string().min(1),
  amount: z.number().int().positive(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  const sessionToken = sessionTokenFrom(request);
  if (!sessionToken) {
    return NextResponse.json({ error: "Sign in to place bets." }, { status: 401 });
  }

  const parsed = betSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bet details." }, { status: 400 });
  }

  try {
    const result = await placeBet(sessionToken, parsed.data.marketId, parsed.data.side, parsed.data.amount);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bet placement failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
