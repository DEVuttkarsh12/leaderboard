const DEFAULT_START_TIME = 1786147293;
const DEFAULT_END_TIME = 1788739292;

export type ShuffleLeaderboardWindow = {
  startTime: number;
  endTime: number;
  startIso: string;
  endIso: string;
};

function parseUnixSeconds(
  value: string | undefined,
  fallback: number
): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.trunc(parsed);
}

export function getShuffleLeaderboardWindow(): ShuffleLeaderboardWindow {
  const startTime = parseUnixSeconds(
    process.env.SHUFFLE_LEADERBOARD_START_TIME,
    DEFAULT_START_TIME
  );
  const endTime = parseUnixSeconds(
    process.env.SHUFFLE_LEADERBOARD_END_TIME,
    DEFAULT_END_TIME
  );

  if (startTime > endTime) {
    throw new Error("Shuffle leaderboard window is invalid.");
  }

  return {
    startTime,
    endTime,
    startIso: new Date(startTime * 1000).toISOString(),
    endIso: new Date(endTime * 1000).toISOString(),
  };
}

export function getClampedShuffleEndTime(nowMs: number = Date.now()): number {
  const { endTime } = getShuffleLeaderboardWindow();
  return Math.min(endTime, Math.floor(nowMs / 1000));
}

export function isShuffleWindowActive(nowMs: number = Date.now()): boolean {
  const { startTime, endTime } = getShuffleLeaderboardWindow();
  const nowUnix = Math.floor(nowMs / 1000);
  return nowUnix >= startTime && nowUnix <= endTime;
}
