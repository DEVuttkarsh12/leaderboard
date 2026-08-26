import { prisma } from "@/lib/server/db/prisma";

export function isDevAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.RANKBOARD_DEV_AUTH === "true";
}

export function shouldMakeDevAuthAdmin() {
  return isDevAuthEnabled() && process.env.RANKBOARD_DEV_AUTH_ADMIN === "true";
}

export function shouldForceDevAuth() {
  return isDevAuthEnabled() && process.env.RANKBOARD_DEV_AUTH_FORCE === "true";
}

export function getDevKickProfile() {
  return {
    user_id: Number(process.env.RANKBOARD_DEV_KICK_ID ?? 900001),
    name: process.env.RANKBOARD_DEV_KICK_USERNAME?.trim() || "devuttkarsh12",
    email: process.env.RANKBOARD_DEV_EMAIL?.trim() || "dev@rankboard.local",
    profile_picture: null,
  };
}

export function getDevDiscordProfile() {
  return {
    id: process.env.RANKBOARD_DEV_DISCORD_ID?.trim() || "900001",
    username: process.env.RANKBOARD_DEV_DISCORD_USERNAME?.trim() || "devuttkarsh12",
    global_name: process.env.RANKBOARD_DEV_DISCORD_GLOBAL_NAME?.trim() || "Dev RankBoard",
    avatar: null,
  };
}

export function getDevTokenSet(provider: "kick" | "discord") {
  return {
    access_token: `dev-${provider}-access-token`,
    refresh_token: `dev-${provider}-refresh-token`,
    expires_in: 60 * 60 * 24 * 30,
    token_type: "Bearer",
    scope: provider === "kick" ? "user:read channel:read events:subscribe" : "identify",
  };
}

export async function promoteDevAuthUser(provider: "kick" | "discord", providerId: string) {
  if (!shouldMakeDevAuthAdmin()) {
    return;
  }

  await prisma.user.updateMany({
    where: provider === "kick" ? { kickId: providerId } : { discordId: providerId },
    data: { role: "ADMIN" },
  });
}
