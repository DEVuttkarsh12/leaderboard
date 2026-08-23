import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { listTournaments } from "@/lib/server/tournaments/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const tournaments = await listTournaments(sessionTokenFrom(request));
    return NextResponse.json({ tournaments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tournament load failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
