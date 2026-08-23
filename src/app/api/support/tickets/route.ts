import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import {
  createSupportTicket,
  listMySupportTickets,
} from "@/lib/server/support/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const tickets = await listMySupportTickets(sessionTokenFrom(request));
    return NextResponse.json({ tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket load failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      category?: unknown;
      subject?: unknown;
      message?: unknown;
    };

    const ticket = await createSupportTicket(sessionTokenFrom(request), {
      category: typeof body.category === "string" ? body.category : "",
      subject: typeof body.subject === "string" ? body.subject : "",
      message: typeof body.message === "string" ? body.message : "",
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket creation failed.";
    const status =
      message === "Ticket subject is too short." ||
      message === "Ticket message is too short." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
