import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser, updateAdminUser } from "@/lib/server/admin/users";
import { SESSION_COOKIE } from "@/lib/server/auth/session";

const updateUserSchema = z.object({
  points: z.number().int().min(0).max(2_000_000_000).optional(),
  xp: z.number().int().min(0).max(2_000_000_000).optional(),
  banned: z.boolean().optional(),
  bannedReason: z.string().trim().max(160).optional(),
  timeoutUntil: z.string().datetime().nullable().optional(),
  role: z.enum(["PLAYER", "ADMIN"]).optional(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter valid user updates." },
      { status: 400 }
    );
  }

  try {
    const admin = await requireAdminUser(sessionTokenFrom(request));
    const { id } = await context.params;

    if (id === admin.id && parsed.data.role === "PLAYER") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role." },
        { status: 400 }
      );
    }

    const user = await updateAdminUser(id, {
      ...parsed.data,
      bannedReason: parsed.data.bannedReason ?? undefined,
      timeoutUntil:
        parsed.data.timeoutUntil === undefined
          ? undefined
          : parsed.data.timeoutUntil
            ? new Date(parsed.data.timeoutUntil)
            : null,
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "User update failed.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
