import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  clearSessionCookie,
  createEmailPasswordSession,
  deleteUserSession,
  getSessionAccount,
  SESSION_COOKIE,
  signInWithEmailPassword,
  setSessionCookie,
} from "@/lib/server/auth/session";

const loginSchema = z.object({
  mode: z.enum(["signin", "signup"]).default("signin"),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(64).optional(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  const account = await getSessionAccount(sessionTokenFrom(request));

  if (!account) {
    const response = NextResponse.json({ account: null });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({ account });
}

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password with at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const result =
      parsed.data.mode === "signup"
        ? await createEmailPasswordSession({
            email: parsed.data.email,
            password: parsed.data.password,
            displayName: parsed.data.displayName,
            currentSessionToken: sessionTokenFrom(request),
          })
        : await signInWithEmailPassword(parsed.data.email, parsed.data.password);
    const response = NextResponse.json({ account: result.account });
    setSessionCookie(response, result.sessionToken, result.expires);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await deleteUserSession(sessionTokenFrom(request));

  const response = NextResponse.json({ account: null });
  clearSessionCookie(response);

  return response;
}
