export type RawCodeshibGroup =
  | string
  | {
      display_name?: string | null;
      name?: string | null;
      slug?: string | null;
    };

export type RawCodeshibUser = {
  id?: string | number | null;
  username?: string | null;
  global_name?: string | null;
  kick_username?: string | null;
  avatar?: string | null;
  xp: number;
  points?: number | null;
  verified?: boolean | null;
  groups?: RawCodeshibGroup[] | null;
  last_active?: string | null;
};

export type NormalizedLeaderboardUser = {
  id: string;
  name: string;
  rank: number;
  score: number;
  avatarUrl: string | null;
  username: string | null;
  globalName: string | null;
  kickUsername: string | null;
  xp: number;
  points: number | null;
  verified: boolean;
  groups: string[];
  lastActive: string | null;
};

export type LeaderboardSummary = {
  users: NormalizedLeaderboardUser[];
  total: number;
  highestScore: number;
  averageScore: number;
};

export type LeaderboardApiResponse = LeaderboardSummary & {
  lastUpdated: string;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};
