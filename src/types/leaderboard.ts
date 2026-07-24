export type RawLeaderboardUser = {
  username: string;
  wagerAmount: number;
  campaignCode?: string;
};

export type NormalizedLeaderboardUser = {
  id: string;
  name: string;
  rank: number;
  score: number;
};

export type LeaderboardApiResponse = {
  users: NormalizedLeaderboardUser[];
  total: number;
  highestScore: number;
  averageScore: number;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};
