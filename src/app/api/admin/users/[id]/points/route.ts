import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, getSessionUserId, SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminSetPoints } from "@/lib/server/points/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  points: z.number().int().min(0).max(10_000_000),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getSessionAccount(sessionTokenFrom(request));
  if (!account) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!account.badges.includes("Admin")) return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const adminId = await getSessionUserId(sessionTokenFrom(request));
  const { id: targetUserId } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid points value (0–10,000,000)." }, { status: 400 });
  }

  try {
    const newPoints = await adminSetPoints(targetUserId, parsed.data.points, adminId ?? "unknown");
    return NextResponse.json({ ok: true, points: newPoints });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update points.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
