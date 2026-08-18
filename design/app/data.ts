export type Player = {
  id: string;
  name: string;
  rank: number;
  score: number;
  xp: number;
  points: number;
  avatarUrl: string | null;
  username: string | null;
  globalName: string | null;
  kickUsername: string | null;
  verified: boolean;
  groups: string[];
  lastActive: string | null;
};

const seeds = [
  ["Vanta•••Ace", "@vanta•••", 982_450, 1_820_400],
  ["Luxe•••Riot", "@luxe•••", 941_880, 1_664_220],
  ["Midas•••X", "@midas•••", 898_260, 1_498_700],
  ["Neon•••Fox", "@neon•••", 856_910, 1_382_440],
  ["Pixel•••Fang", "@pixel•••", 821_340, 1_271_900],
  ["Zero•••Luck", "@zero•••", 798_770, 1_190_550],
  ["Turbo•••Mint", "@turbo•••", 754_320, 1_086_900],
  ["Ghost•••Bet", "@ghost•••", 721_640, 998_420],
  ["Rogue•••404", "@rogue•••", 689_280, 922_760],
  ["Cosmo•••Kid", "@cosmo•••", 655_990, 874_300],
  ["Blitz•••Pop", "@blitz•••", 624_500, 818_950],
  ["Jinx•••Wave", "@jinx•••", 592_880, 760_440],
  ["Frost•••Byte", "@frost•••", 565_210, 709_820],
  ["Dizzy•••Duke", "@dizzy•••", 538_760, 668_900],
  ["Lucky•••Rex", "@lucky•••", 506_430, 624_180],
  ["Nova•••77", "@nova•••", 481_920, 588_660],
  ["Karma•••Kit", "@karma•••", 458_310, 552_940],
  ["Aero•••Rush", "@aero•••", 433_780, 510_720],
  ["Bambi•••Boss", "@bambi•••", 410_990, 476_380],
  ["Glitch•••Gem", "@glitch•••", 389_400, 441_900],
  ["Sonic•••Sun", "@sonic•••", 367_880, 409_660],
  ["Cherry•••Hex", "@cherry•••", 344_120, 378_420],
  ["Panda•••Punk", "@panda•••", 321_740, 346_880],
  ["Mochi•••Max", "@mochi•••", 298_510, 319_200],
  ["Orbit•••Odd", "@orbit•••", 276_840, 289_450],
  ["Cobra•••Coin", "@cobra•••", 252_610, 261_900],
  ["Velvet•••Vex", "@velvet•••", 231_220, 238_550],
  ["Waffle•••Win", "@waffle•••", 209_780, 214_300],
] as const;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function numeric(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * API bridge for the future `/api/leaderboard` connection. The UI consumes
 * only this normalized Player shape, so swapping mock data for a fetch does
 * not require changing the board, podium, search, sorting, or pagination.
 */
export function normalizeLeaderboardPayload(payload: unknown): Player[] {
  const envelope = record(payload);
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(envelope.players)
      ? envelope.players
      : Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(envelope.leaderboard)
          ? envelope.leaderboard
          : [];

  return source.map((item, index) => {
    const row = record(item);
    const rank = numeric(row.rank, index + 1);
    const name = optionalString(row.name) ?? optionalString(row.globalName) ?? `Player ${rank}`;
    const groups = Array.isArray(row.groups) ? row.groups.filter((group): group is string => typeof group === "string") : [];
    return {
      id: optionalString(row.id) ?? `rb-${String(rank).padStart(3, "0")}`,
      name,
      rank,
      score: numeric(row.score, numeric(row.xp)),
      xp: numeric(row.xp, numeric(row.score)),
      points: numeric(row.points),
      avatarUrl: optionalString(row.avatarUrl),
      username: optionalString(row.username),
      globalName: optionalString(row.globalName),
      kickUsername: optionalString(row.kickUsername),
      verified: Boolean(row.verified),
      groups,
      lastActive: optionalString(row.lastActive),
    };
  }).sort((a, b) => a.rank - b.rank);
}

const mockPayload = seeds.map(([name, username, xp, points], index) => ({
  id: `rb-${String(index + 1).padStart(3, "0")}`,
  name,
  rank: index + 1,
  score: Math.round(xp * 1.12 + points * 0.18),
  xp,
  points,
  avatarUrl: null,
  username,
  globalName: name.replace("•••", " "),
  kickUsername: username.replace("@", "kick/"),
  verified: index < 8 || index % 4 === 0,
  groups: index < 3 ? ["Front Three", "High Roller"] : index < 10 ? ["Hot Streak"] : ["Challenger"],
  lastActive: index < 18 ? `${(index % 8) + 1}m ago` : `${(index % 4) + 1}h ago`,
}));

export const players: Player[] = normalizeLeaderboardPayload(mockPayload);
