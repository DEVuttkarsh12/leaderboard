import { NextRequest, NextResponse } from "next/server";
import { adminCancelMarket } from "@/lib/server/bets/service";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const cancelSchema = z.object({
  marketId: z.string().min(1),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  const sessionToken = sessionTokenFrom(request);
  const parsed = cancelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide marketId." }, { status: 400 });
  }

  try {
    const result = await adminCancelMarket(sessionToken, parsed.data.marketId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel market.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
