import { rawLeaderboardSchema } from "./leaderboard-schema";
import type {
  RawLeaderboardUser,
  NormalizedLeaderboardUser,
  LeaderboardApiResponse,
} from "@/types/leaderboard";

function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function convertToId(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

export function maskUsername(username: string): string {
  if (username.length <= 4) {
    return username[0] + "***" + username[username.length - 1];
  }
  return username.slice(0, 3) + "***" + username.slice(-1);
}

export function normalizeLeaderboardUser(
  raw: RawLeaderboardUser,
  rank: number
): NormalizedLeaderboardUser {
  return {
    id: convertToId(raw.username),
    name: raw.username,
    rank,
    score: raw.wagerAmount,
  };
}

export function parseAndNormalizeLeaderboard(
  data: unknown
): LeaderboardApiResponse {
  const parsed = rawLeaderboardSchema.parse(data);

  const validUsers: RawLeaderboardUser[] = [];
  for (const user of parsed) {
    if (
      typeof user.username === "string" &&
      typeof user.wagerAmount === "number"
    ) {
      validUsers.push(user);
    }
  }

  validUsers.sort((a, b) => b.wagerAmount - a.wagerAmount);

  const users = validUsers.map((user, index) =>
    normalizeLeaderboardUser(user, index + 1)
  );

  const scores = users.map((u) => u.score);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

  return {
    users,
    total: users.length,
    highestScore,
    averageScore,
  };
}

export { getNameInitials };
