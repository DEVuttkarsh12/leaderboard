import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { updateSupportTicketStatus } from "@/lib/server/support/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = (await request.json()) as { status?: unknown };
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!status) {
      return NextResponse.json({ error: "status is required." }, { status: 400 });
    }

    const { id } = await context.params;
    const ticket = await updateSupportTicketStatus(
      sessionTokenFrom(request),
      id,
      status
    );

    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket update failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      message === "Invalid ticket status." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
