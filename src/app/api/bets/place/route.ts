import { NextRequest, NextResponse } from "next/server";
import { placeBet } from "@/lib/server/bets/service";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const betSchema = z.object({
  marketId: z.string().trim().min(1).max(128),
  side: z.string().trim().min(1).max(64),
  amount: z.number().int().positive().max(2_000_000_000),
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
    const knownErrors = new Set([
      "Sign in to place bets.",
      "Enter a valid bet amount.",
      "This betting market is not open for bets.",
      "Invalid side chosen.",
      "User session expired.",
      "Not enough points.",
    ]);
    const candidate = error instanceof Error ? error.message : "";
    const message = knownErrors.has(candidate) ? candidate : "Bet placement failed. Try again.";
    return NextResponse.json(
      { error: message },
      { status: candidate === "Sign in to place bets." || candidate === "User session expired." ? 401 : 400 }
    );
  }
}
