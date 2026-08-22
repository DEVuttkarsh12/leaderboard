import { NextRequest, NextResponse } from "next/server";
import { adminSettleMarket } from "@/lib/server/bets/service";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settleSchema = z.object({
  marketId: z.string().min(1),
  winningSide: z.string().min(1),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  const sessionToken = sessionTokenFrom(request);
  const parsed = settleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide marketId and winningSide." }, { status: 400 });
  }

  try {
    const result = await adminSettleMarket(sessionToken, parsed.data.marketId, parsed.data.winningSide);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to settle market.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
