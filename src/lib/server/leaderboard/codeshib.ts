import { parseAndNormalizeLeaderboard } from "@/lib/normalize-leaderboard";
import type { LeaderboardRouteResult } from "./result";

const TIMEOUT_MS = 10_000;
const REVALIDATE_SECONDS = 60;
const CODESHIB_USERS_URL = "https://codeshib.com/api/v3/users";

function buildCodeshibUsersUrl(): string {
  const url = new URL(CODESHIB_USERS_URL);
  url.searchParams.set("sort_by", "xp");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("per_page", "100");
  return url.toString();
}

export async function getCodeshibLeaderboard(): Promise<LeaderboardRouteResult> {
  const apiKey = process.env.LEADERBOARD_API_KEY;

  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: "config_error",
        message: "Leaderboard service is not configured.",
      },
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(buildCodeshibUsersUrl(), {
      method: "GET",
      signal: controller.signal,
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        status: 502,
        body: {
          error: "auth_error",
          message: "The leaderboard service is temporarily unavailable.",
        },
      };
    }

    if (response.status === 429) {
      return {
        status: 429,
        body: {
          error: "rate_limited",
          message: "The leaderboard service is temporarily unavailable. Please try again.",
        },
      };
    }

    if (!response.ok) {
      return {
        status: 502,
        body: {
          error: "api_error",
          message: "The leaderboard could not be loaded.",
        },
      };
    }

    const rawData: unknown = await response.json();

    try {
      const normalized = parseAndNormalizeLeaderboard(rawData);

      return {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
        body: {
          ...normalized,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch {
      return {
        status: 502,
        body: {
          error: "parse_error",
          message: "The leaderboard could not be loaded.",
        },
      };
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      return {
        status: 504,
        body: {
          error: "timeout",
          message: "The request took too long. Please try again.",
        },
      };
    }

    return {
      status: 502,
      body: {
        error: "network_error",
        message: "The leaderboard service is temporarily unavailable.",
      },
    };
  }
}

