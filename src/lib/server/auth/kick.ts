import { createHash, createVerify, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/server/db/prisma";

export const KICK_OAUTH_STATE_COOKIE = "rankboard_kick_oauth_state";
export const KICK_OAUTH_VERIFIER_COOKIE = "rankboard_kick_oauth_verifier";
export const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
export const KICK_PUBLIC_KEY_URL = "https://api.kick.com/public/v1/public-key";
export const KICK_EVENTS_SUBSCRIPTIONS_URL = "https://api.kick.com/public/v1/events/subscriptions";
export const KICK_DEFAULT_SCOPE = "user:read channel:read events:subscribe";

let cachedKickPublicKey: string | null = null;

export function getKickRedirectUri(request: NextRequest) {
  return (
    process.env.KICK_REDIRECT_URI?.trim() ||
    new URL("/api/auth/kick/callback", request.url).toString()
  );
}

export function createKickPkcePair() {
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return {
    codeVerifier,
    codeChallenge,
  };
}

function kickClientCredentials() {
  const clientId = process.env.KICK_CLIENT_ID?.trim();
  const clientSecret = process.env.KICK_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Kick OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

export async function getKickAppAccessToken() {
  const { clientId, clientSecret } = kickClientCredentials();
  const response = await fetch(KICK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error("Kick app token request failed.");
  }

  const payload = (await response.json()) as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || !payload.access_token) {
    throw new Error("Kick app token response was invalid.");
  }

  return payload.access_token;
}

export async function getKickUserAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "kick" },
    orderBy: { updatedAt: "desc" },
  });

  if (!account?.access_token) {
    throw new Error("Kick account is not connected.");
  }

  const expiresAt = account.expires_at ? account.expires_at * 1000 : null;
  if (!expiresAt || expiresAt > Date.now() + 60_000) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error("Kick account must be reconnected.");
  }

  const { clientId, clientSecret } = kickClientCredentials();
  const response = await fetch(KICK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error("Kick token refresh failed.");
  }

  const tokens = (await response.json()) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    token_type?: unknown;
    scope?: unknown;
  };

  if (typeof tokens.access_token !== "string" || !tokens.access_token) {
    throw new Error("Kick token refresh response was invalid.");
  }

  const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : null;
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: tokens.access_token,
      refresh_token:
        typeof tokens.refresh_token === "string"
          ? tokens.refresh_token
          : account.refresh_token,
      expires_at: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : account.expires_at,
      token_type:
        typeof tokens.token_type === "string" ? tokens.token_type : account.token_type,
      scope: typeof tokens.scope === "string" ? tokens.scope : account.scope,
    },
  });

  return tokens.access_token;
}

async function getKickPublicKey() {
  if (cachedKickPublicKey) return cachedKickPublicKey;

  if (process.env.KICK_WEBHOOK_PUBLIC_KEY?.trim()) {
    cachedKickPublicKey = process.env.KICK_WEBHOOK_PUBLIC_KEY.trim().replace(/\\n/g, "\n");
    return cachedKickPublicKey;
  }

  const response = await fetch(KICK_PUBLIC_KEY_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Kick public key fetch failed.");
  }

  const payload = (await response.json()) as { data?: { public_key?: unknown }; public_key?: unknown };
  const key =
    typeof payload.public_key === "string"
      ? payload.public_key
      : typeof payload.data?.public_key === "string"
        ? payload.data.public_key
        : "";

  if (!key) {
    throw new Error("Kick public key response was invalid.");
  }

  cachedKickPublicKey = key.replace(/\\n/g, "\n");
  return cachedKickPublicKey;
}

export async function verifyKickWebhookSignature(
  headers: Headers,
  rawBody: string
) {
  if (process.env.KICK_WEBHOOK_SKIP_SIGNATURE === "true") {
    return true;
  }

  const messageId = headers.get("Kick-Event-Message-Id");
  const timestamp = headers.get("Kick-Event-Message-Timestamp");
  const signature = headers.get("Kick-Event-Signature");

  if (!messageId || !timestamp || !signature) {
    return false;
  }

  const publicKey = await getKickPublicKey();
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${messageId}.${timestamp}.${rawBody}`);
  verifier.end();

  return verifier.verify(publicKey, Buffer.from(signature, "base64"));
}
