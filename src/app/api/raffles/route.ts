import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { getCurrentRaffle } from "@/lib/server/raffles/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const raffle = await getCurrentRaffle(sessionTokenFrom(request));
    return NextResponse.json({ raffle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Raffle load failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
