import { rawLeaderboardSchema } from "./leaderboard-schema";
import type {
  RawCodeshibGroup,
  RawCodeshibUser,
  NormalizedLeaderboardUser,
  LeaderboardSummary,
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

function convertToId(raw: RawCodeshibUser): string {
  if (raw.id !== null && raw.id !== undefined) {
    return String(raw.id);
  }

  const fallback = raw.username ?? raw.global_name ?? raw.kick_username;
  return fallback
    ? fallback.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "unknown-user";
}

function getDisplayName(raw: RawCodeshibUser): string | null {
  return raw.username ?? raw.global_name ?? raw.kick_username ?? null;
}

function normalizeGroups(groups: RawCodeshibGroup[] | null | undefined): string[] {
  if (!groups) return [];

  return groups
    .map((group) => {
      if (typeof group === "string") return group.trim() || null;
      return group.display_name ?? group.name ?? group.slug ?? null;
    })
    .filter((group): group is string => Boolean(group));
}

function normalizeAvatarUrl(
  avatar: string | null | undefined,
  userId: string
): string | null {
  if (!avatar) return null;

  try {
    const url = new URL(avatar);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return avatar;
    }
  } catch {}

  const extension = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${extension}?size=128`;
}

function getSourceTotal(data: unknown, fallbackTotal: number): number {
  if (typeof data !== "object" || data === null) {
    return fallbackTotal;
  }

  const pagination = (data as { pagination?: unknown }).pagination;
  if (typeof pagination !== "object" || pagination === null) {
    return fallbackTotal;
  }

  const total = (pagination as { total?: unknown }).total;
  if (typeof total === "number" && Number.isFinite(total)) {
    return total;
  }
  if (typeof total === "string") {
    const parsed = Number(total);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallbackTotal;
}

function hasSearchableIdentity(user: RawCodeshibUser): boolean {
  return Boolean(user.username ?? user.global_name ?? user.kick_username);
}

export function getSearchableNames(user: NormalizedLeaderboardUser): string[] {
  return [user.name, user.username, user.globalName, user.kickUsername].filter(
    (value): value is string => Boolean(value)
  );
}

export function normalizeLeaderboardUser(
  raw: RawCodeshibUser,
  rank: number
): NormalizedLeaderboardUser {
  const displayName = getDisplayName(raw);
  const id = convertToId(raw);

  if (!displayName) {
    throw new Error("User is missing a searchable identity.");
  }

  return {
    id,
    name: displayName,
    rank,
    score: raw.xp,
    avatarUrl: normalizeAvatarUrl(raw.avatar, id),
    username: raw.username ?? null,
    globalName: raw.global_name ?? null,
    kickUsername: raw.kick_username ?? null,
    xp: raw.xp,
    points: raw.points ?? null,
    verified: Boolean(raw.verified),
    groups: normalizeGroups(raw.groups),
    lastActive: raw.last_active ?? null,
  };
}

export function parseAndNormalizeLeaderboard(
  data: unknown
): LeaderboardSummary {
  const parsed = rawLeaderboardSchema.parse(data);

  const validUsers: RawCodeshibUser[] = [];
  for (const user of parsed) {
    if (hasSearchableIdentity(user)) {
      validUsers.push(user);
    }
  }

  validUsers.sort((a, b) => b.xp - a.xp);

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
    total: getSourceTotal(data, users.length),
    highestScore,
    averageScore,
  };
}

export { getNameInitials };
