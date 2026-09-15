import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { redeemStoreItem } from "@/lib/server/store/service";

export const runtime = "nodejs";

const redeemSchema = z.object({
  itemId: z.string().trim().min(1).max(128),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = redeemSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid store item." }, { status: 400 });
    }

    const { purchase, newPoints } = await redeemStoreItem(
      sessionTokenFrom(request),
      parsed.data.itemId
    );

    return NextResponse.json({ purchase, newPoints });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Redemption failed.";
    const status =
      message === "Sign in to redeem store items." ? 401 :
      message === "Not enough points." || message === "This item is sold out." || message === "Item not found." ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Store redemption could not be completed." : message },
      { status }
    );
  }
}
