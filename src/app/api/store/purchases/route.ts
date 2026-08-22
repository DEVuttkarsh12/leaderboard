import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { listUserPurchases } from "@/lib/server/store/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const purchases = await listUserPurchases(sessionTokenFrom(request));
    return NextResponse.json({ purchases });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load purchases.";
    const status = message === "Sign in to view purchases." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
