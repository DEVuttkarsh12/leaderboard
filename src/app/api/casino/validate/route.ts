import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCasinoPlayer } from "@/lib/server/casino/verification";
import { getSessionUserId, SESSION_COOKIE } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  provider: z.enum(["thrill", "packdraw", "shuffle"]),
  username: z.string().trim().min(2).max(64),
});

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request.cookies.get(SESSION_COOKIE)?.value);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to check a casino username." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    provider: searchParams.get("provider"),
    username: searchParams.get("username"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid provider and username." }, { status: 400 });
  }

  try {
    const result = await validateCasinoPlayer(parsed.data.provider, parsed.data.username);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Casino lookup is temporarily unavailable." },
      { status: 502 }
    );
  }
}
