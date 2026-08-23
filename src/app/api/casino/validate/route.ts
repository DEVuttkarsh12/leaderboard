import { NextRequest, NextResponse } from "next/server";
import { validateCasinoPlayer } from "@/lib/server/casino/verification";
import type { CasinoProvider } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as CasinoProvider;
  const username = searchParams.get("username");

  if (!provider || !username) {
    return NextResponse.json({ error: "Missing provider or username" }, { status: 400 });
  }

  const result = await validateCasinoPlayer(provider, username);
  return NextResponse.json(result);
}
