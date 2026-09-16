import { NextResponse } from "next/server";
import { getSiteBanner } from "@/lib/server/site/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ banner: await getSiteBanner() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Site banner could not be loaded.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}