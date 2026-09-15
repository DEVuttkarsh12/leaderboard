import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, getSessionUserId, getSessionAccount } from "@/lib/server/auth/session";
import { linkCasinoAccount, validateCasinoPlayer } from "@/lib/server/casino/verification";

export const dynamic = "force-dynamic";

const linkSchema = z.object({
  provider: z.enum(["thrill", "packdraw", "shuffle"]),
  username: z.string().trim().min(2).max(64),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await getSessionUserId(sessionToken);

  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = linkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider, username, or email." }, { status: 400 });
  }

  const { provider, username, email } = parsed.data;

  try {
    const existence = await validateCasinoPlayer(provider, username);
    if (!existence.exists) {
      return NextResponse.json({ error: existence.message || `Player ${username} not found on ${provider}.` }, { status: 400 });
    }

    const casinoAccount = await linkCasinoAccount({
      userId,
      provider,
      username: existence.canonicalUsername ?? username,
      email: email || undefined,
    });

    const account = await getSessionAccount(sessionToken);

    return NextResponse.json({
      success: true,
      casinoAccount,
      account,
      playerDetails: existence,
      message: casinoAccount.isVerified
        ? `${provider} account verified and linked.`
        : existence.foundInLeaderboard
          ? `${provider} player found and linked. Ownership verification is pending.`
          : `${provider} account linked. Ownership verification is pending.`,
    });
  } catch (error) {
    console.error("Casino account link failed.", error);
    const candidate = error instanceof Error ? error.message : "";
    const message = candidate.includes("already linked to another player")
      ? candidate
      : "Could not link that casino account. Check the details and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
