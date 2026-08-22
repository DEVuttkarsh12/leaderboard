import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { redeemStoreItem } from "@/lib/server/store/service";

export const runtime = "nodejs";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { itemId?: unknown };
    const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required." }, { status: 400 });
    }

    const { purchase, newPoints } = await redeemStoreItem(
      sessionTokenFrom(request),
      itemId
    );

    return NextResponse.json({ purchase, newPoints });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redemption failed.";
    const status =
      message === "Sign in to redeem store items." ? 401 :
      message === "Not enough points." || message === "This item is sold out." || message === "Item not found." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
