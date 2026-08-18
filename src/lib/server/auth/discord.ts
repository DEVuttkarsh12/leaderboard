import type { NextRequest } from "next/server";

export const DISCORD_OAUTH_STATE_COOKIE = "rankboard_discord_oauth_state";

export function getDiscordRedirectUri(request: NextRequest) {
  return (
    process.env.DISCORD_REDIRECT_URI?.trim() ||
    new URL("/api/auth/discord/callback", request.url).toString()
  );
}
