import type { LeaderboardApiResponse } from "@/types/leaderboard";
import { getShuffleLeaderboardWindow } from "./shuffle-window";

export type ShuffleSnapshotState = {
  data: LeaderboardApiResponse | null;
  fetchedAt: number | null;
  lastServedAt: number | null;
  refreshStartedAt: number | null;
  lastError: string | null;
  windowStartTime: number;
  windowEndTime: number;
};

type ShuffleSnapshotStore = {
  snapshot: ShuffleSnapshotState;
  refreshPromise: Promise<void> | null;
};

declare global {
  var __shuffleSnapshotStore: ShuffleSnapshotStore | undefined;
}

function createStore(): ShuffleSnapshotStore {
  const { startTime, endTime } = getShuffleLeaderboardWindow();

  return {
    snapshot: {
      data: null,
      fetchedAt: null,
      lastServedAt: null,
      refreshStartedAt: null,
      lastError: null,
      windowStartTime: startTime,
      windowEndTime: endTime,
    },
    refreshPromise: null,
  };
}

function ensureStore(): ShuffleSnapshotStore {
  if (!globalThis.__shuffleSnapshotStore) {
    globalThis.__shuffleSnapshotStore = createStore();
    return globalThis.__shuffleSnapshotStore;
  }

  const currentWindow = getShuffleLeaderboardWindow();
  const snapshot = globalThis.__shuffleSnapshotStore.snapshot;

  if (
    snapshot.windowStartTime !== currentWindow.startTime ||
    snapshot.windowEndTime !== currentWindow.endTime
  ) {
    globalThis.__shuffleSnapshotStore = createStore();
  }

  return globalThis.__shuffleSnapshotStore;
}

export function getShuffleSnapshotState(): Readonly<ShuffleSnapshotState> {
  return ensureStore().snapshot;
}

export function readShuffleSnapshot(): LeaderboardApiResponse | null {
  return ensureStore().snapshot.data;
}

export function storeShuffleSnapshot(
  data: LeaderboardApiResponse,
  fetchedAt: number = Date.now()
): void {
  const store = ensureStore();
  store.snapshot.data = data;
  store.snapshot.fetchedAt = fetchedAt;
  store.snapshot.refreshStartedAt = null;
  store.snapshot.lastError = null;
}

export function markShuffleSnapshotServed(
  servedAt: number = Date.now()
): void {
  ensureStore().snapshot.lastServedAt = servedAt;
}

export function markShuffleSnapshotRefreshStarted(
  startedAt: number = Date.now()
): void {
  ensureStore().snapshot.refreshStartedAt = startedAt;
}

export function markShuffleSnapshotError(
  error: string,
  occurredAt: number = Date.now()
): void {
  const store = ensureStore();
  store.snapshot.lastError = error;
  store.snapshot.refreshStartedAt = null;
  store.snapshot.lastServedAt = occurredAt;
}

export function getShuffleRefreshPromise(): Promise<void> | null {
  return ensureStore().refreshPromise;
}

export function setShuffleRefreshPromise(
  refreshPromise: Promise<void> | null
): void {
  ensureStore().refreshPromise = refreshPromise;
}

