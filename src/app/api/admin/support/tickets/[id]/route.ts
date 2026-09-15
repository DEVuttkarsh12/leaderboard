import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { updateSupportTicketStatus } from "@/lib/server/support/service";

export const runtime = "nodejs";

const ticketStatusSchema = z.object({
  status: z.enum(["Open", "OPEN", "Waiting", "WAITING", "Solved", "SOLVED"]),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const parsed = ticketStatusSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid ticket status." }, { status: 400 });
    }

    const { id } = await context.params;
    const ticket = await updateSupportTicketStatus(
      sessionTokenFrom(request),
      id,
      parsed.data.status
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
