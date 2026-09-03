import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getKickRedirectUri,
  KICK_TOKEN_URL,
  KICK_OAUTH_STATE_COOKIE,
  KICK_OAUTH_VERIFIER_COOKIE,
} from "@/lib/server/auth/kick";
import {
  createKickUserSession,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/lib/server/auth/session";

const KICK_USER_URL = "https://api.kick.com/public/v1/users";

const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_expires_in: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
});

const profileSchema = z.object({
  data: z
    .array(
      z.object({
        user_id: z.number(),
        name: z.string().min(1),
        email: z.string().nullable().optional(),
        profile_picture: z.string().nullable().optional(),
      })
    )
    .min(1),
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
  response.cookies.delete(KICK_OAUTH_STATE_COOKIE);
  response.cookies.delete(KICK_OAUTH_VERIFIER_COOKIE);
  return response;
}

async function exchangeCodeForToken(
  request: NextRequest,
  code: string,
  codeVerifier: string
) {
  const clientId = process.env.KICK_CLIENT_ID?.trim();
  const clientSecret = process.env.KICK_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Kick OAuth is not configured.");
  }

  const response = await fetch(KICK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: getKickRedirectUri(request),
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error("Kick token exchange failed.");
  }

  return tokenSchema.parse(await response.json());
}

async function fetchKickProfile(accessToken: string) {
  const response = await fetch(KICK_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Kick profile fetch failed.");
  }

  return profileSchema.parse(await response.json()).data[0];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(KICK_OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(KICK_OAUTH_VERIFIER_COOKIE)?.value;

  if (error) {
    return loginRedirect(request, { auth_error: error });
  }

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    return loginRedirect(request, { auth_error: "kick_state" });
  }

  try {
    const tokens = await exchangeCodeForToken(request, code, codeVerifier);
    const profile = await fetchKickProfile(tokens.access_token);
    const { sessionToken, expires, account } = await createKickUserSession(
      profile,
      tokens,
      request.cookies.get(SESSION_COOKIE)?.value
    );
    const response = loginRedirect(
      request,
      { kick: "connected" },
      account.badges.includes("Admin") ? "/admin" : "/profile"
    );
    setSessionCookie(response, sessionToken, expires);

    return response;
  } catch (callbackError) {
    console.error(callbackError);
    return loginRedirect(request, { auth_error: "kick_callback" });
  }
}
