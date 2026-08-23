import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, getSessionUserId, getSessionAccount } from "@/lib/server/auth/session";
import { verifyCasinoCode, recheckAutoVerification } from "@/lib/server/casino/verification";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  provider: z.enum(["thrill", "packdraw", "shuffle"]),
  code: z.string().optional(),
  recheck: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await getSessionUserId(sessionToken);

  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification payload." }, { status: 400 });
  }

  const { provider, code, recheck } = parsed.data;

  try {
    let casinoAccount;
    if (recheck) {
      casinoAccount = await recheckAutoVerification(userId, provider);
      if (!casinoAccount?.isVerified) {
        return NextResponse.json({
          error: "Auto-verification could not confirm account match. Please verify using your code or link Kick.",
        }, { status: 400 });
      }
    } else if (code) {
      casinoAccount = await verifyCasinoCode({ userId, provider, code });
    } else {
      return NextResponse.json({ error: "Provide a verification code." }, { status: 400 });
    }

    const account = await getSessionAccount(sessionToken);

    return NextResponse.json({
      success: true,
      casinoAccount,
      account,
      message: `Verified ${provider} account successfully! Points sync enabled.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
