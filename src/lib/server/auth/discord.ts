import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

export const DISCORD_OAUTH_STATE_COOKIE = "rankboard_discord_oauth_state";
export const DISCORD_OAUTH_VERIFIER_COOKIE = "rankboard_discord_oauth_verifier";

export function createDiscordPkcePair() {
  const codeVerifier = randomBytes(48).toString("base64url");
  return {
    codeVerifier,
    codeChallenge: createHash("sha256")
      .update(codeVerifier)
      .digest("base64url"),
  };
}

export function getDiscordRedirectUri(request: NextRequest) {
  return (
    process.env.DISCORD_REDIRECT_URI?.trim() ||
    new URL("/api/auth/discord/callback", request.url).toString()
  );
}
