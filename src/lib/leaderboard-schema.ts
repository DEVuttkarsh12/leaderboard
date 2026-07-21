import { z } from "zod";

export const rawLeaderboardUserSchema = z.object({
  username: z.string(),
  wagerAmount: z.number(),
  weightedWagerAmount: z.number(),
});

export const rawLeaderboardSchema = z.array(rawLeaderboardUserSchema);

export const rawLeaderboardItemSchema = z.object({
  username: z.string(),
  wagerAmount: z.number(),
  weightedWagerAmount: z.number(),
});
