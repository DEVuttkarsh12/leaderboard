import { createHmac, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/server/db/prisma";

type AuthMode = "signin" | "signup";

const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
const SIGN_UP_WINDOW_MS = 60 * 60 * 1000;

export class AuthRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    super(`Too many authentication attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    this.name = "AuthRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function clientAddress(request: NextRequest) {
  const value =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "local";
  return value.split(",")[0]?.trim().slice(0, 128) || "unknown";
}

function rateLimitSecret() {
  return (
    process.env.AUTH_RATE_LIMIT_SECRET?.trim() ||
    process.env.AUTH_ENCRYPTION_KEY?.trim() ||
    process.env.KICK_CLIENT_SECRET?.trim() ||
    "local-development-rate-limit-key"
  );
}

function opaqueKey(value: string) {
  return createHmac("sha256", rateLimitSecret())
    .update(value)
    .digest("base64url");
}

function identifiers(request: NextRequest, email: string, mode: AuthMode) {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    ip: `auth:${mode}:ip:${opaqueKey(clientAddress(request))}`,
    account: `auth:${mode}:account:${opaqueKey(normalizedEmail)}`,
  };
}

async function activeAttempts(identifier: string, now: Date) {
  return prisma.verificationToken.count({
    where: { identifier, expires: { gt: now } },
  });
}

export async function assertAuthAttemptAllowed(
  request: NextRequest,
  email: string,
  mode: AuthMode
) {
  const now = new Date();
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: { startsWith: "auth:" },
      expires: { lte: now },
    },
  });
  const keys = identifiers(request, email, mode);
  const [ipAttempts, accountAttempts] = await Promise.all([
    activeAttempts(keys.ip, now),
    activeAttempts(keys.account, now),
  ]);
  const ipLimit = mode === "signin" ? 30 : 6;
  const accountLimit = mode === "signin" ? 6 : 3;

  if (ipAttempts >= ipLimit || accountAttempts >= accountLimit) {
    const windowMs = mode === "signin" ? SIGN_IN_WINDOW_MS : SIGN_UP_WINDOW_MS;
    throw new AuthRateLimitError(Math.ceil(windowMs / 1000));
  }
}

export async function recordAuthAttempt(
  request: NextRequest,
  email: string,
  mode: AuthMode
) {
  const keys = identifiers(request, email, mode);
  const expires = new Date(
    Date.now() + (mode === "signin" ? SIGN_IN_WINDOW_MS : SIGN_UP_WINDOW_MS)
  );

  await prisma.verificationToken.createMany({
    data: [keys.ip, keys.account].map((identifier) => ({
      identifier,
      token: randomBytes(24).toString("base64url"),
      expires,
    })),
  });
}

export async function clearAccountAuthFailures(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: `auth:signin:account:${opaqueKey(normalizedEmail)}`,
    },
  });
}
