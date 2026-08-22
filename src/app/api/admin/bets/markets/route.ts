import { NextRequest, NextResponse } from "next/server";
import { adminCreateMarket } from "@/lib/server/bets/service";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createMarketSchema = z.object({
  title: z.string().min(1).max(120),
  type: z.string().max(32).optional(),
  deadline: z.string().max(32).optional(),
  sideA: z.string().min(1).max(64),
  sideB: z.string().min(1).max(64),
  oddsA: z.number().positive(),
  oddsB: z.number().positive(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  const sessionToken = sessionTokenFrom(request);
  const parsed = createMarketSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid market details." }, { status: 400 });
  }

  try {
    const market = await adminCreateMarket(sessionToken, parsed.data);
    return NextResponse.json({ market });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create market.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
