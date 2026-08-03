import { z } from "zod";

const nullableTrimmedStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const numericSchema = z.preprocess((value) => {
  if (typeof value === "string") return Number(value);
  return value;
}, z.number().finite());

const nullableNumericSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return Number(value);
  return value;
}, z.number().finite().nullable());

const rawCodeshibGroupSchema = z.union([
  z.string(),
  z
    .object({
      display_name: nullableTrimmedStringSchema.optional(),
      name: nullableTrimmedStringSchema.optional(),
      slug: nullableTrimmedStringSchema.optional(),
    })
    .passthrough(),
]);

export const rawLeaderboardUserSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullish(),
    username: nullableTrimmedStringSchema.optional(),
    global_name: nullableTrimmedStringSchema.optional(),
    kick_username: nullableTrimmedStringSchema.optional(),
    avatar: nullableTrimmedStringSchema.optional(),
    xp: numericSchema,
    points: nullableNumericSchema.optional(),
    verified: z.boolean().nullish(),
    groups: z.array(rawCodeshibGroupSchema).nullish(),
    last_active: nullableTrimmedStringSchema.optional(),
  })
  .passthrough();

const rawLeaderboardUsersSchema = z.array(rawLeaderboardUserSchema);

export const rawLeaderboardSchema = z.union([
  rawLeaderboardUsersSchema,
  z
    .object({
      data: rawLeaderboardUsersSchema,
    })
    .passthrough()
    .transform(({ data }) => data),
  z
    .object({
      users: rawLeaderboardUsersSchema,
    })
    .passthrough()
    .transform(({ users }) => users),
  z
    .object({
      data: z
        .object({
          users: rawLeaderboardUsersSchema,
        })
        .passthrough(),
    })
    .passthrough()
    .transform(({ data }) => data.users),
]);
