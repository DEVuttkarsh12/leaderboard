import { NextResponse } from "next/server";
import { listBetMarkets } from "@/lib/server/bets/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const markets = await listBetMarkets();
    return NextResponse.json({ markets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load markets.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
