import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { listHunts } from "@/lib/server/hunts/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const data = await listHunts(sessionTokenFrom(request));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Hunts load failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
