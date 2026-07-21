import { NextResponse } from "next/server";
import { parseAndNormalizeLeaderboard } from "@/lib/normalize-leaderboard";

const TIMEOUT_MS = 10_000;

export async function GET() {
  const apiUrl = process.env.LEADERBOARD_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      { error: "config_error", message: "Leaderboard service is not configured." },
      { status: 503 }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
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

    return NextResponse.json(normalized, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
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
