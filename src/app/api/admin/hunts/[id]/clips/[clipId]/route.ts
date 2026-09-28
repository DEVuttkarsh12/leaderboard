import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import { deleteAdminHuntClip, updateAdminHuntClip } from "@/lib/server/hunts/service";

export const runtime = "nodejs";

const clipUpdateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  multiplier: z.number().min(0).max(1_000_000_000).optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide a highlight update.");

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Highlight update failed.";
  const status = message === "Admin login required." || message === "Admin access required." ? 403 : message === "Hunt highlight not found." ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; clipId: string }> }) {
  const parsed = clipUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid highlight updates." }, { status: 400 });
  }

  try {
    const { id, clipId } = await context.params;
    const clip = await updateAdminHuntClip(request.cookies.get(SESSION_COOKIE)?.value, id, clipId, parsed.data);
    return NextResponse.json({ clip });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; clipId: string }> }) {
  try {
    const { id, clipId } = await context.params;
    await deleteAdminHuntClip(request.cookies.get(SESSION_COOKIE)?.value, id, clipId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
