const DEFAULT_MIN_POLL_INTERVAL_MS = 35_000;
const DEFAULT_STALE_AFTER_MS = 45_000;

export type ShufflePollPolicy = {
  minPollIntervalMs: number;
  staleAfterMs: number;
};

type ShuffleRateLimitState = ShufflePollPolicy & {
  lastAttemptAt: number | null;
  lastSuccessAt: number | null;
  lastRateLimitedAt: number | null;
  nextAllowedAt: number;
};

declare global {
  var __shuffleRateLimitState: ShuffleRateLimitState | undefined;
}

function parseMs(
  value: string | undefined,
  fallback: number
): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1_000) {
    return fallback;
  }

  return Math.trunc(parsed);
}

export function getShufflePollPolicy(): ShufflePollPolicy {
  return {
    minPollIntervalMs: parseMs(
      process.env.SHUFFLE_MIN_POLL_INTERVAL_MS,
      DEFAULT_MIN_POLL_INTERVAL_MS
    ),
    staleAfterMs: parseMs(
      process.env.SHUFFLE_SNAPSHOT_STALE_MS,
      DEFAULT_STALE_AFTER_MS
    ),
  };
}

function ensureState(): ShuffleRateLimitState {
  const policy = getShufflePollPolicy();

  if (!globalThis.__shuffleRateLimitState) {
    globalThis.__shuffleRateLimitState = {
      ...policy,
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastRateLimitedAt: null,
      nextAllowedAt: 0,
    };
  } else {
    globalThis.__shuffleRateLimitState.minPollIntervalMs =
      policy.minPollIntervalMs;
    globalThis.__shuffleRateLimitState.staleAfterMs = policy.staleAfterMs;
  }

  return globalThis.__shuffleRateLimitState;
}

export function getShuffleRateLimitState(): Readonly<ShuffleRateLimitState> {
  return ensureState();
}

export function canPollShuffle(nowMs: number = Date.now()): boolean {
  return nowMs >= ensureState().nextAllowedAt;
}

export function beginShufflePoll(nowMs: number = Date.now()): void {
  const state = ensureState();
  state.lastAttemptAt = nowMs;
  state.nextAllowedAt = Math.max(
    state.nextAllowedAt,
    nowMs + state.minPollIntervalMs
  );
}

export function markShufflePollSuccess(nowMs: number = Date.now()): void {
  ensureState().lastSuccessAt = nowMs;
}

export function markShuffleRateLimited(nowMs: number = Date.now()): void {
  const state = ensureState();
  state.lastRateLimitedAt = nowMs;
  state.nextAllowedAt = Math.max(
    state.nextAllowedAt,
    nowMs + Math.max(30_000, state.minPollIntervalMs)
  );
}

export function isShuffleSnapshotStale(
  fetchedAt: number | null,
  nowMs: number = Date.now()
): boolean {
  if (fetchedAt === null) return true;
  return nowMs - fetchedAt >= ensureState().staleAfterMs;
}

