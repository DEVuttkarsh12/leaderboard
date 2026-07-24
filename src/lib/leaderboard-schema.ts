import { z } from "zod";

export const rawLeaderboardUserSchema = z.object({
  username: z.string(),
  wagerAmount: z.number(),
  campaignCode: z.string().optional(),
});

export const rawLeaderboardSchema = z.array(rawLeaderboardUserSchema);
