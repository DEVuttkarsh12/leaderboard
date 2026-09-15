import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCasinoPlayer } from "@/lib/server/casino/verification";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  provider: z.enum(["thrill", "packdraw", "shuffle"]),
  username: z.string().trim().min(2).max(64),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    provider: searchParams.get("provider"),
    username: searchParams.get("username"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid provider and username." }, { status: 400 });
  }

  const result = await validateCasinoPlayer(parsed.data.provider, parsed.data.username);
  return NextResponse.json(result);
}
