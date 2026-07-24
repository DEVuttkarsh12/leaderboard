import { NextResponse } from "next/server";
import { parseAndNormalizeLeaderboard, maskUsername } from "@/lib/normalize-leaderboard";

const TIMEOUT_MS = 10_000;

function isTooManyRequest(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  return obj.message === "TOO_MANY_REQUEST";
}

function isRefereesNotFound(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  return obj.message === "REFEREES_NOT_FOUND";
}

export async function GET(request: Request) {
  const apiUrl = process.env.LEADERBOARD_API_URL;
  const apiKey = process.env.LEADERBOARD_API_KEY;

  if (!apiUrl) {
    return NextResponse.json(
      { error: "config_error", message: "Leaderboard service is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  const url = new URL(apiUrl);
  if (startTime) url.searchParams.set("startTime", startTime);
  if (endTime) url.searchParams.set("endTime", endTime);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers,
      next: { revalidate: 60 },
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: "auth_error", message: "The leaderboard service is temporarily unavailable." },
        { status: 502 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { error: "rate_limited", message: "The leaderboard service is temporarily unavailable. Please try again." },
        { status: 429 }
      );
    }

    if (response.status === 400) {
      const errorBody: unknown = await response.json().catch(() => null);
      if (isTooManyRequest(errorBody)) {
        return NextResponse.json(
          { error: "rate_limited", message: "The leaderboard service is temporarily unavailable. Please try again." },
          { status: 429 }
        );
      }
      if (isRefereesNotFound(errorBody)) {
        return NextResponse.json(
          { users: [], total: 0, highestScore: 0, averageScore: 0 },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "api_error", message: "The leaderboard could not be loaded." },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "api_error", message: "The leaderboard could not be loaded." },
        { status: 502 }
      );
    }

    const rawData: unknown = await response.json();

    let normalized;
    try {
      normalized = parseAndNormalizeLeaderboard(rawData);
    } catch {
      return NextResponse.json(
        { error: "parse_error", message: "The leaderboard could not be loaded." },
        { status: 502 }
      );
    }

    const maskedUsers = normalized.users.map((user) => ({
      ...user,
      name: maskUsername(user.name),
    }));

    return NextResponse.json(
      { ...normalized, users: maskedUsers },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "timeout", message: "The request took too long. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "network_error", message: "The leaderboard service is temporarily unavailable." },
      { status: 502 }
    );
  }
}
