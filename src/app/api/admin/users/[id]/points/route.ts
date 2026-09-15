import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { requireAdminUser } from "@/lib/server/admin/users";
import { adminAdjustPoints } from "@/lib/server/points/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  operation: z.enum(["add", "deduct", "set"]),
  amount: z.number().int().min(0).max(2_000_000_000),
  note: z.string().trim().max(120).optional(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose Add, Deduct, or Set and enter a valid whole-number amount." }, { status: 400 });
  }

  try {
    const admin = await requireAdminUser(sessionTokenFrom(request));
    const newPoints = await adminAdjustPoints(
      targetUserId,
      parsed.data.operation,
      parsed.data.amount,
      admin.id,
      parsed.data.note
    );
    return NextResponse.json({ ok: true, points: newPoints });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update points.";
    const status = message.includes("Admin") || message.includes("login") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
