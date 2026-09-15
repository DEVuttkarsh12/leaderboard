import { NextRequest, NextResponse } from "next/server";
import { ingestKickWebhook } from "@/lib/server/kick/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > 256_000) {
      return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 256_000) {
      return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
    }
    const result = await ingestKickWebhook(request.headers, rawBody);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kick webhook failed.";
    const status =
      message === "Kick webhook signature verification failed." ? 401 :
      message.includes("payload missing") || error instanceof SyntaxError ? 400 :
      500;
    return NextResponse.json(
      { error: status === 500 ? "Kick webhook could not be processed." : message },
      { status }
    );
  }
}
