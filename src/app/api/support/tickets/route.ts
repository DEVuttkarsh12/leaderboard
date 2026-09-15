import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import {
  createSupportTicket,
  listMySupportTickets,
} from "@/lib/server/support/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ticketSchema = z.object({
  category: z.string().trim().min(1).max(50),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(5_000),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    const tickets = await listMySupportTickets(sessionTokenFrom(request));
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Support ticket load failed.", error);
    return NextResponse.json({ error: "Support tickets could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = ticketSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Choose a category, add a 3+ character subject, and write at least 10 characters." },
        { status: 400 }
      );
    }

    const ticket = await createSupportTicket(sessionTokenFrom(request), parsed.data);

    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket creation failed.";
    const status =
      message === "Ticket subject is too short." ||
      message === "Ticket message is too short." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Support request could not be created." : message },
      { status }
    );
  }
}
