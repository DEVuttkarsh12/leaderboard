import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { createAdminHuntClip } from "@/lib/server/hunts/service";

export const runtime = "nodejs";

const clipSchema = z.object({
  title: z.string().trim().min(1).max(100),
  multiplier: z.number().min(0).max(1_000_000_000),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = clipSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a highlight title and valid multiplier." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const clip = await createAdminHuntClip(request.cookies.get(SESSION_COOKIE)?.value, id, parsed.data);
    return NextResponse.json({ clip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Highlight could not be created.";
    const status = message === "Admin login required." || message === "Admin access required." ? 403 : message === "Hunt not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
