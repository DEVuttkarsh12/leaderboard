import type { NormalizedLeaderboardUser } from "@/types/leaderboard";

const API_TIMEOUT = 10_000;

export type FetchLeaderboardResult = {
  users: NormalizedLeaderboardUser[];
  total: number;
  highestScore: number;
  averageScore: number;
};

export async function fetchLeaderboardFromApi(
  signal?: AbortSignal
): Promise<FetchLeaderboardResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const response = await fetch("/api/leaderboard", {
      signal: combinedSignal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || "The leaderboard could not be loaded."
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function combineAbortSignals(
  ...signals: AbortSignal[]
): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }

  return controller.signal;
}
