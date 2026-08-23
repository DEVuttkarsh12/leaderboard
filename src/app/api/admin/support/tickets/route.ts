import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { listAdminSupportTickets } from "@/lib/server/support/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const tickets = await listAdminSupportTickets(
      sessionTokenFrom(request),
      request.nextUrl.searchParams.get("status") ?? undefined
    );
    return NextResponse.json({ tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket load failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      message === "Invalid ticket status." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
