import { NextRequest, NextResponse } from "next/server";
import {
  disconnectOAuthProvider,
  SESSION_COOKIE,
  type OAuthProvider,
} from "@/lib/server/auth/session";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isOAuthProvider(provider: string): provider is OAuthProvider {
  return provider === "kick" || provider === "discord";
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.json(
      { error: "Unknown connected account." },
      { status: 404 }
    );
  }

  try {
    const account = await disconnectOAuthProvider(
      sessionTokenFrom(request),
      provider
    );

    return NextResponse.json({ account });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not disconnect account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
