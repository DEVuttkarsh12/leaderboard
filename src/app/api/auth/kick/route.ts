import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createKickUserSession,
  getSessionAccount,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/lib/server/auth/session";
import {
  getDevKickProfile,
  getDevTokenSet,
  isDevAuthEnabled,
  promoteDevAuthUser,
  shouldForceDevAuth,
} from "@/lib/server/auth/dev";
import {
  createKickPkcePair,
  getKickRedirectUri,
  KICK_DEFAULT_SCOPE,
  KICK_OAUTH_STATE_COOKIE,
  KICK_OAUTH_VERIFIER_COOKIE,
} from "@/lib/server/auth/kick";

const KICK_AUTHORIZE_URL = "https://id.kick.com/oauth/authorize";

function redirectToLogin(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("auth_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.KICK_CLIENT_ID?.trim();

  if (shouldForceDevAuth() || !clientId) {
    if (isDevAuthEnabled()) {
      const profile = getDevKickProfile();
      const { sessionToken, expires, account } = await createKickUserSession(
        profile,
        getDevTokenSet("kick"),
        request.cookies.get(SESSION_COOKIE)?.value
      );
      await promoteDevAuthUser("kick", String(profile.user_id));
      const currentAccount = await getSessionAccount(sessionToken);

      const url = new URL(
        (currentAccount ?? account).badges.includes("Admin") ? "/admin" : "/profile",
        request.url
      );
      url.searchParams.set("kick", "connected");
      url.searchParams.set("dev_auth", "kick");
      const response = NextResponse.redirect(url);
      setSessionCookie(response, sessionToken, expires);
      return response;
    }

    return redirectToLogin(request, "kick_config");
  }

  const state = randomBytes(32).toString("base64url");
  const { codeVerifier, codeChallenge } = createKickPkcePair();
  const authUrl = new URL(KICK_AUTHORIZE_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getKickRedirectUri(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", process.env.KICK_OAUTH_SCOPE?.trim() || KICK_DEFAULT_SCOPE);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authUrl);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  };

  response.cookies.set({
    ...cookieOptions,
    name: KICK_OAUTH_STATE_COOKIE,
    value: state,
  });
  response.cookies.set({
    ...cookieOptions,
    name: KICK_OAUTH_VERIFIER_COOKIE,
    value: codeVerifier,
  });

  return response;
}
