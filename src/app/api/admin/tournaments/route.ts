import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { createTournament, listAdminTournaments } from "@/lib/server/tournaments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().trim().min(1).max(100),
  starts: z.string().trim().min(1).max(100),
  prize: z.string().trim().min(1).max(80),
  seats: z.number().int().min(2).max(64),
  participants: z.array(z.string().trim().min(1).max(80)).max(64).default([]),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Tournament action failed.";
  const status = message.includes("Admin") ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ tournaments: await listAdminTournaments(sessionTokenFrom(request)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid tournament details." }, { status: 400 });
  }

  try {
    return NextResponse.json({ tournament: await createTournament(sessionTokenFrom(request), parsed.data) });
  } catch (error) {
    return errorResponse(error);
  }
}
