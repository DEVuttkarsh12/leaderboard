import { NextRequest, NextResponse } from "next/server";

type RateBucket = { count: number; resetAt: number };

const buckets = new Map<string, RateBucket>();
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_API_BODY_BYTES = 1_000_000;

function clientAddress(request: NextRequest) {
  const value =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "local";
  return value.split(",")[0]?.trim().slice(0, 128) || "unknown";
}

function jsonError(message: string, status: number, retryAfter?: number) {
  const response = NextResponse.json({ error: message }, { status });
  if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
  return response;
}

function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (current.count >= limit) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }
  current.count += 1;
  return null;
}

function isTrustedBrowserRequest(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const parsedOrigin = new URL(origin);
    if (parsedOrigin.origin === request.nextUrl.origin) return true;

    const forwardedHost =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const forwardedProtocol =
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl.protocol.replace(/:$/, "");

    return Boolean(
      forwardedHost &&
        parsedOrigin.host === forwardedHost &&
        parsedOrigin.protocol === `${forwardedProtocol}:`
    );
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();
  const address = clientAddress(request);
  const isWebhook = pathname === "/api/webhooks/kick";
  const isAuthStart =
    method === "GET" &&
    (pathname === "/api/auth/kick" || pathname === "/api/auth/discord");

  if (isAuthStart) {
    const retryAfter = consumeRateLimit(`oauth:${address}`, 20, 10 * 60 * 1000);
    if (retryAfter) {
      return jsonError("Too many login requests. Try again shortly.", 429, retryAfter);
    }
  }

  if (method === "GET" && pathname === "/api/casino/validate") {
    const retryAfter = consumeRateLimit(`casino-lookup:${address}`, 30, 10 * 60 * 1000);
    if (retryAfter) {
      return jsonError("Too many account checks. Try again shortly.", 429, retryAfter);
    }
  }

  if (!SAFE_METHODS.has(method) && !isWebhook) {
    if (!isTrustedBrowserRequest(request)) {
      return jsonError("This request could not be verified. Refresh the page and try again.", 403);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_API_BODY_BYTES) {
      return jsonError("This request is too large.", 413);
    }

    const retryAfter = consumeRateLimit(`mutation:${address}`, 180, 60 * 1000);
    if (retryAfter) {
      return jsonError("Too many requests. Please wait a moment and try again.", 429, retryAfter);
    }

    if (pathname === "/api/support/tickets" && method === "POST") {
      const supportRetry = consumeRateLimit(`support:${address}`, 8, 60 * 60 * 1000);
      if (supportRetry) {
        return jsonError("Too many support requests. Please try again later.", 429, supportRetry);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
