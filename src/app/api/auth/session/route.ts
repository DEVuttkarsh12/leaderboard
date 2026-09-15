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
import {
  assertAuthAttemptAllowed,
  AuthRateLimitError,
  clearAccountAuthFailures,
  recordAuthAttempt,
} from "@/lib/server/security/auth-rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const loginSchema = z.object({
  mode: z.enum(["signin", "signup"]).default("signin"),
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
  displayName: z.string().trim().min(1).max(64).optional(),
}).superRefine((data, context) => {
  if (data.mode !== "signup") return;

  if (data.password.length < 12) {
    context.addIssue({
      code: "custom",
      path: ["password"],
      message: "Use at least 12 characters.",
    });
  }
  if (!/[a-z]/i.test(data.password) || !/\d/.test(data.password)) {
    context.addIssue({
      code: "custom",
      path: ["password"],
      message: "Include at least one letter and one number.",
    });
  }
  if (/^(password|qwerty|letmein|welcome|admin|123456)/i.test(data.password)) {
    context.addIssue({
      code: "custom",
      path: ["password"],
      message: "Choose a less common password.",
    });
  }
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
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const signup = body as { mode?: unknown } | null;
    return NextResponse.json(
      {
        error:
          signup?.mode === "signup"
            ? "Use a valid email and a password with 12+ characters, including a letter and number."
            : "Enter a valid email and password.",
      },
      { status: 400 }
    );
  }

  try {
    await assertAuthAttemptAllowed(request, parsed.data.email, parsed.data.mode);
    if (parsed.data.mode === "signup") {
      await recordAuthAttempt(request, parsed.data.email, "signup");
    }

    const result =
      parsed.data.mode === "signup"
        ? await createEmailPasswordSession({
            email: parsed.data.email,
            password: parsed.data.password,
            displayName: parsed.data.displayName,
            currentSessionToken: sessionTokenFrom(request),
          })
        : await signInWithEmailPassword(parsed.data.email, parsed.data.password);
    if (parsed.data.mode === "signin") {
      await clearAccountAuthFailures(parsed.data.email);
    }
    const response = NextResponse.json({ account: result.account });
    setSessionCookie(response, result.sessionToken, result.expires);

    return response;
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        }
      );
    }

    if (parsed.data.mode === "signin") {
      await recordAuthAttempt(request, parsed.data.email, "signin");
    }
    const message =
      parsed.data.mode === "signup"
        ? "Could not create an account with those details. Try signing in instead."
        : "Email or password is incorrect.";
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
