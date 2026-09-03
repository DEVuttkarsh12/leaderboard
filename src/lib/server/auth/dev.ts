import { prisma } from "@/lib/server/db/prisma";
import {
  hasConfiguredAdminAllowlist,
  reconcileConfiguredAdminRole,
} from "@/lib/server/auth/session";

export function isDevAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.RANKBOARD_DEV_AUTH === "true";
}

export function shouldMakeDevAuthAdmin(provider?: "kick" | "discord") {
  if (!isDevAuthEnabled()) {
    return false;
  }

  if (provider) {
    const scopedValue =
      process.env[`RANKBOARD_DEV_${provider.toUpperCase()}_AUTH_ADMIN`]
        ?.trim()
        .toLowerCase();

    if (scopedValue === "true" || scopedValue === "false") {
      return scopedValue === "true";
    }
  }

  return process.env.RANKBOARD_DEV_AUTH_ADMIN === "true";
}

export function shouldForceDevAuth() {
  return isDevAuthEnabled() && process.env.RANKBOARD_DEV_AUTH_FORCE === "true";
}

export function getDevKickProfile() {
  return {
    user_id: Number(process.env.RANKBOARD_DEV_KICK_ID ?? 900001),
    name: process.env.RANKBOARD_DEV_KICK_USERNAME?.trim() || "devuttkarsh",
    email: process.env.RANKBOARD_DEV_EMAIL?.trim() || "dev@rankboard.local",
    profile_picture: null,
  };
}

export function getDevDiscordProfile() {
  return {
    id: process.env.RANKBOARD_DEV_DISCORD_ID?.trim() || "900001",
    username: process.env.RANKBOARD_DEV_DISCORD_USERNAME?.trim() || "devuttkarsh",
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
  if (!shouldMakeDevAuthAdmin(provider)) {
    return;
  }

  if (hasConfiguredAdminAllowlist()) {
    const users = await prisma.user.findMany({
      where: provider === "kick" ? { kickId: providerId } : { discordId: providerId },
      select: {
        id: true,
        email: true,
        discordId: true,
        discordUsername: true,
        kickId: true,
        kickUsername: true,
        role: true,
      },
    });

    await Promise.all(users.map((user) => reconcileConfiguredAdminRole(user)));
    return;
  }

  await prisma.user.updateMany({
    where: provider === "kick" ? { kickId: providerId } : { discordId: providerId },
    data: { role: "ADMIN" },
  });
}
