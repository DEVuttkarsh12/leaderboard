import { NextResponse } from "next/server";
import { getSiteBanner } from "@/lib/server/site/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ banner: await getSiteBanner() });
  } catch {
    return NextResponse.json({ error: "Site banner could not be loaded." }, { status: 500 });
  }
}
