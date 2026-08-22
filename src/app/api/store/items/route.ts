import { NextResponse } from "next/server";
import { listStoreItems } from "@/lib/server/store/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await listStoreItems();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load store items.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
