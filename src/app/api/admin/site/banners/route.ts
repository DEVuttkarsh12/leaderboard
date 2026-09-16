import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/server/admin/users";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import {
  getSiteBanner,
  updateSiteBanner,
} from "@/lib/server/site/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bannerSchema = z.object({
  announcement: z.string().max(200),
  banner: z.string().max(200),
  promotion: z.string().max(200),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser(sessionTokenFrom(request));
    return NextResponse.json({ banner: await getSiteBanner() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin access required.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = bannerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide announcement, banner, and promotion texts (each 200 characters max)." },
      { status: 400 }
    );
  }

  try {
    const admin = await requireAdminUser(sessionTokenFrom(request));
    const banner = await updateSiteBanner(parsed.data, admin.id);
    return NextResponse.json({ banner });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Site banner could not be saved.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}