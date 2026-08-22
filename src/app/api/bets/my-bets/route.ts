import { NextRequest, NextResponse } from "next/server";
import { listUserBets } from "@/lib/server/bets/service";
import { SESSION_COOKIE } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  const sessionToken = sessionTokenFrom(request);
  if (!sessionToken) {
    return NextResponse.json({ bets: [] });
  }

  try {
    const bets = await listUserBets(sessionToken);
    return NextResponse.json({ bets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bets.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
