import type { ApiErrorResponse, LeaderboardApiResponse } from "@/types/leaderboard";

export type LeaderboardRouteResult = {
  status: number;
  body: LeaderboardApiResponse | ApiErrorResponse;
  headers?: Record<string, string>;
};

