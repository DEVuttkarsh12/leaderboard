import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminCreateStoreItem } from "@/lib/server/store/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(180).optional(),
  cost: z.number().int().min(0).max(100_000_000),
  tag: z.string().max(32).optional(),
  stock: z.number().int().min(0).max(1_000_000),
  unlimited: z.boolean().optional(),
  imageLabel: z.string().max(12).optional(),
  imageUrl: z.string().max(750_000).optional(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid item details." }, { status: 400 });
  }

  try {
    const item = await adminCreateStoreItem(sessionTokenFrom(request), parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Store item creation failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      400;
    return NextResponse.json({ error: message }, { status });
  }
}
