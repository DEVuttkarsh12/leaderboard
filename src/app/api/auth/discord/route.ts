import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  DISCORD_OAUTH_STATE_COOKIE,
  getDiscordRedirectUri,
} from "@/lib/server/auth/discord";
import {
  createDiscordUserSession,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/lib/server/auth/session";
import {
  getDevDiscordProfile,
  getDevTokenSet,
  isDevAuthEnabled,
  promoteDevAuthUser,
  shouldForceDevAuth,
} from "@/lib/server/auth/dev";

const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";

function redirectToLogin(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("auth_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();

  if (shouldForceDevAuth() || !clientId) {
    if (isDevAuthEnabled()) {
      const profile = getDevDiscordProfile();
      const { sessionToken, expires } = await createDiscordUserSession(
        profile,
        getDevTokenSet("discord"),
        request.cookies.get(SESSION_COOKIE)?.value
      );
      await promoteDevAuthUser("discord", profile.id);

      const url = new URL("/login", request.url);
      url.searchParams.set("discord", "connected");
      url.searchParams.set("dev_auth", "discord");
      const response = NextResponse.redirect(url);
      setSessionCookie(response, sessionToken, expires);
      return response;
    }

    return redirectToLogin(request, "discord_config");
  }

  const state = randomBytes(32).toString("base64url");
  const authUrl = new URL(DISCORD_AUTHORIZE_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getDiscordRedirectUri(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "identify");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set({
    name: DISCORD_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
