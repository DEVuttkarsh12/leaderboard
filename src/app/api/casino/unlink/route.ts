import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, getSessionUserId, getSessionAccount } from "@/lib/server/auth/session";
import { unlinkCasinoAccount } from "@/lib/server/casino/verification";

export const dynamic = "force-dynamic";

const unlinkSchema = z.object({
  provider: z.enum(["thrill", "packdraw", "shuffle"]),
});

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await getSessionUserId(sessionToken);

  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = unlinkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }

  try {
    await unlinkCasinoAccount(userId, parsed.data.provider);
    const account = await getSessionAccount(sessionToken);

    return NextResponse.json({
      success: true,
      account,
      message: `Unlinked ${parsed.data.provider} account.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unlink failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
