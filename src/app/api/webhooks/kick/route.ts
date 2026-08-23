import { NextRequest, NextResponse } from "next/server";
import { ingestKickWebhook } from "@/lib/server/kick/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const result = await ingestKickWebhook(request.headers, rawBody);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kick webhook failed.";
    const status =
      message === "Kick webhook signature verification failed." ? 401 :
      message.includes("payload missing") ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
