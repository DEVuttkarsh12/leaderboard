import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminUpdateStoreItem } from "@/lib/server/store/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1).max(80).optional(),
  description: z.string().max(180).optional(),
  cost: z.number().int().min(0).max(100_000_000).optional(),
  tag: z.string().max(32).optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  unlimited: z.boolean().optional(),
  active: z.boolean().optional(),
  imageLabel: z.string().max(12).optional(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid item updates." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const item = await adminUpdateStoreItem(sessionTokenFrom(request), id, parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Store item update failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      400;
    return NextResponse.json({ error: message }, { status });
  }
}
