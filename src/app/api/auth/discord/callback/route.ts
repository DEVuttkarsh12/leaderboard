import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DISCORD_OAUTH_STATE_COOKIE,
  getDiscordRedirectUri,
} from "@/lib/server/auth/discord";
import {
  createDiscordUserSession,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/lib/server/auth/session";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";

const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

const profileSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  global_name: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

function loginRedirect(
  request: NextRequest,
  params: Record<string, string>,
  pathname = "/login"
) {
  const url = new URL(pathname, request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete(DISCORD_OAUTH_STATE_COOKIE);
  return response;
}

async function exchangeCodeForToken(request: NextRequest, code: string) {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth is not configured.");
  }

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: getDiscordRedirectUri(request),
    }),
  });

  if (!response.ok) {
    throw new Error("Discord token exchange failed.");
  }

  return tokenSchema.parse(await response.json());
}

async function fetchDiscordProfile(accessToken: string) {
  const response = await fetch(DISCORD_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Discord profile fetch failed.");
  }

  return profileSchema.parse(await response.json());
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(DISCORD_OAUTH_STATE_COOKIE)?.value;

  if (error) {
    return loginRedirect(request, { auth_error: error });
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginRedirect(request, { auth_error: "discord_state" });
  }

  try {
    const tokens = await exchangeCodeForToken(request, code);
    const profile = await fetchDiscordProfile(tokens.access_token);
    const { sessionToken, expires, account } = await createDiscordUserSession(
      profile,
      tokens,
      request.cookies.get(SESSION_COOKIE)?.value
    );
    const response = loginRedirect(
      request,
      { discord: "connected" },
      account.badges.includes("Admin") ? "/admin" : "/profile"
    );
    setSessionCookie(response, sessionToken, expires);

    return response;
  } catch (callbackError) {
    console.error(callbackError);
    return loginRedirect(request, { auth_error: "discord_callback" });
  }
}
