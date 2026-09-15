import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/server/admin/users";
import { SESSION_COOKIE } from "@/lib/server/auth/session";
import {
  getWatchPointConfig,
  updateWatchPointConfig,
} from "@/lib/server/watch/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const configSchema = z.object({
  pointsPerInterval: z.number().int().min(0).max(1_000_000),
  intervalSeconds: z.number().int().min(10).max(3_600),
  dailyBonus: z.number().int().min(0).max(1_000_000),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser(sessionTokenFrom(request));
    return NextResponse.json({ config: await getWatchPointConfig() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin access required.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = configSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Use 0-1,000,000 points, a 10-3,600 second interval, and a valid daily bonus." },
      { status: 400 }
    );
  }

  try {
    const admin = await requireAdminUser(sessionTokenFrom(request));
    const config = await updateWatchPointConfig(parsed.data, admin.id);
    return NextResponse.json({ config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Watch settings could not be saved.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
