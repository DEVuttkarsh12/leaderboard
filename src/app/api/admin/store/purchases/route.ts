import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminListStorePurchases } from "@/lib/server/store/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const purchases = await adminListStorePurchases(sessionTokenFrom(request));
    return NextResponse.json({ purchases });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase load failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
