import type { LeaderboardRouteResult } from "./result";
import {
  beginShufflePoll,
  canPollShuffle,
  getShufflePollPolicy,
  getShuffleRateLimitState,
  isShuffleSnapshotStale,
  markShufflePollSuccess,
  markShuffleRateLimited,
} from "./shuffle-rate-limit";
import {
  getShuffleRefreshPromise,
  getShuffleSnapshotState,
  markShuffleSnapshotError,
  markShuffleSnapshotRefreshStarted,
  markShuffleSnapshotServed,
  readShuffleSnapshot,
  setShuffleRefreshPromise,
  storeShuffleSnapshot,
} from "./shuffle-snapshot-cache";
import { getClampedShuffleEndTime, getShuffleLeaderboardWindow, isShuffleWindowActive } from "./shuffle-window";
import type { LeaderboardApiResponse, NormalizedLeaderboardUser } from "@/types/leaderboard";

function getShuffleAffiliateUrl(): string | null {
  const value = process.env.SHUFFLE_AFFILIATE_URL?.trim();
  return value ? value : null;
}

function isShuffleUpstreamEnabled(): boolean {
  return process.env.SHUFFLE_ENABLE_UPSTREAM === "true";
}

type RawShuffleLeaderboardUser = {
  username?: unknown;
  wagerAmount?: unknown;
  weightedWagerAmount?: unknown;
};

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function toShuffleId(username: string): string {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeShuffleLeaderboard(
  data: unknown,
  fetchedAtIso: string
): LeaderboardApiResponse {
  if (!Array.isArray(data)) {
    throw new Error("Shuffle response is not an array.");
  }

  const users: NormalizedLeaderboardUser[] = data
    .map((entry): RawShuffleLeaderboardUser => {
      if (typeof entry !== "object" || entry === null) {
        return {};
      }
      return entry as RawShuffleLeaderboardUser;
    })
    .map((entry) => {
      const username =
        typeof entry.username === "string" ? entry.username.trim() : "";
      const wagerAmount = toFiniteNumber(entry.wagerAmount);
      const weightedWagerAmount = toFiniteNumber(entry.weightedWagerAmount);

      return {
        username,
        wagerAmount,
        weightedWagerAmount,
      };
    })
    .filter(
      (entry) =>
        entry.username.length > 0 &&
        (entry.weightedWagerAmount > 0 || entry.wagerAmount > 0)
    )
    .sort((a, b) => {
      if (b.weightedWagerAmount !== a.weightedWagerAmount) {
        return b.weightedWagerAmount - a.weightedWagerAmount;
      }
      return b.wagerAmount - a.wagerAmount;
    })
    .map((entry, index) => ({
      id: toShuffleId(entry.username) || `shuffle-user-${index + 1}`,
      name: entry.username,
      rank: index + 1,
      score: entry.weightedWagerAmount,
      avatarUrl: null,
      username: entry.username,
      globalName: null,
      kickUsername: null,
      xp: entry.weightedWagerAmount,
      points: entry.wagerAmount,
      verified: false,
      groups: [],
      lastActive: null,
    }));

  const scores = users.map((user) => user.score);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

  return {
    users,
    total: users.length,
    highestScore,
    averageScore,
    lastUpdated: fetchedAtIso,
  };
}

async function fetchShuffleSnapshot(): Promise<void> {
  const affiliateUrl = getShuffleAffiliateUrl();

  if (!affiliateUrl) {
    throw new Error("Shuffle affiliate URL is not configured.");
  }

  const endTime = getClampedShuffleEndTime();
  const { startTime } = getShuffleLeaderboardWindow();
  const url = new URL(affiliateUrl);
  url.searchParams.set("startTime", String(startTime));
  url.searchParams.set("endTime", String(endTime));

  const nowMs = Date.now();
  beginShufflePoll(nowMs);
  markShuffleSnapshotRefreshStarted(nowMs);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 400) {
    const bodyText = await response.text();
    if (bodyText.includes("TOO_MANY_REQUEST")) {
      markShuffleRateLimited(nowMs);
      throw new Error("Shuffle rate limit reached.");
    }
  }

  if (!response.ok) {
    throw new Error(`Shuffle request failed with status ${response.status}.`);
  }

  const rawData: unknown = await response.json();
  const fetchedAtIso = new Date(nowMs).toISOString();
  const normalized = normalizeShuffleLeaderboard(rawData, fetchedAtIso);

  storeShuffleSnapshot(normalized, nowMs);
  markShufflePollSuccess(nowMs);
}

async function ensureShuffleSnapshot(): Promise<void> {
  const currentRefresh = getShuffleRefreshPromise();
  if (currentRefresh) {
    await currentRefresh;
    return;
  }

  const refreshPromise = fetchShuffleSnapshot()
    .catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to refresh Shuffle leaderboard.";
      markShuffleSnapshotError(message);
      throw error;
    })
    .finally(() => {
      setShuffleRefreshPromise(null);
    });

  setShuffleRefreshPromise(refreshPromise);
  await refreshPromise;
}

export async function getShuffleLeaderboard(): Promise<LeaderboardRouteResult> {
  const affiliateUrl = getShuffleAffiliateUrl();

  if (!affiliateUrl) {
    return {
      status: 503,
      body: {
        error: "config_error",
        message: "Leaderboard service is not configured.",
      },
    };
  }

  let window;
  let snapshotState;

  try {
    window = getShuffleLeaderboardWindow();
    snapshotState = getShuffleSnapshotState();
  } catch {
    return {
      status: 503,
      body: {
        error: "config_error",
        message: "Leaderboard service is not configured.",
      },
    };
  }

  const snapshot = readShuffleSnapshot();

  if (snapshot) {
    const isStale = isShuffleSnapshotStale(snapshotState.fetchedAt);
    if (isStale && isShuffleUpstreamEnabled() && canPollShuffle()) {
      try {
        await ensureShuffleSnapshot();
      } catch {
        // Serve the last good snapshot if refresh fails.
      }
    }

    const latestSnapshot = readShuffleSnapshot();
    markShuffleSnapshotServed();
    return {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
      body: latestSnapshot ?? snapshot,
    };
  }

  if (isShuffleUpstreamEnabled() && canPollShuffle()) {
    try {
      await ensureShuffleSnapshot();
      const populatedSnapshot = readShuffleSnapshot();
      if (populatedSnapshot) {
        markShuffleSnapshotServed();
        return {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
          body: populatedSnapshot,
        };
      }
    } catch {
      // Fall through to the structured error response below.
    }
  }

  const rateLimitState = getShuffleRateLimitState();
  const pollPolicy = getShufflePollPolicy();
  const nowMs = Date.now();
  const nowSeconds = Math.floor(nowMs / 1000);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(Math.max(rateLimitState.nextAllowedAt - nowMs, 0) / 1000)
  );

  return {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Retry-After": String(retryAfterSeconds),
      "X-Leaderboard-Window-Start": String(window.startTime),
      "X-Leaderboard-Window-End": String(window.endTime),
      "X-Rate-Limit-Min-Poll-Seconds": String(
        Math.ceil(pollPolicy.minPollIntervalMs / 1000)
      ),
      "X-Upstream-Polling-Enabled": String(isShuffleUpstreamEnabled()),
      "X-Rate-Limit-Window-Active": String(isShuffleWindowActive(nowMs)),
      "X-Snapshot-Window-Ready": String(
        snapshotState.windowStartTime === window.startTime &&
          snapshotState.windowEndTime === window.endTime
      ),
      "X-Snapshot-Stale": String(
        isShuffleSnapshotStale(snapshotState.fetchedAt, nowMs)
      ),
      "X-Shuffle-End-Time-Clamped": String(getClampedShuffleEndTime(nowMs)),
      "X-Shuffle-Now-Seconds": String(nowSeconds),
    },
    body: {
      error: "cache_miss",
      message: "Shuffle snapshot cache is not populated yet.",
    },
  };
}
