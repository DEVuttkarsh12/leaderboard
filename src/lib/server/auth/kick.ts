import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

export const KICK_OAUTH_STATE_COOKIE = "rankboard_kick_oauth_state";
export const KICK_OAUTH_VERIFIER_COOKIE = "rankboard_kick_oauth_verifier";

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
