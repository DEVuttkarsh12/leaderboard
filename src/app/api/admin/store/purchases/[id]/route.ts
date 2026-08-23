import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { adminUpdateStorePurchaseStatus } from "@/lib/server/store/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "REJECTED"]),
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
    return NextResponse.json({ error: "Provide a valid purchase status." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const purchase = await adminUpdateStorePurchaseStatus(
      sessionTokenFrom(request),
      id,
      parsed.data.status
    );

    return NextResponse.json({ purchase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Purchase update failed.";
    const status =
      message === "Admin login required." || message === "Admin access required." ? 403 :
      400;
    return NextResponse.json({ error: message }, { status });
  }
}
