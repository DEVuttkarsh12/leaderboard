import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db/prisma";
import type { AuthAccountPayload } from "@/lib/auth/account";
import {
  linkCasinoAccount,
  unlinkCasinoAccount,
} from "@/lib/server/casino/verification";

export const SESSION_COOKIE = "rankboard_session";

const SESSION_DAYS = 30;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const PASSWORD_KEY_LENGTH = 64;
const scryptAsync = promisify(scrypt);

type SessionUser = {
  id: string;
  email: string | null;
  passwordHash?: string | null;
  image: string | null;
  displayName: string | null;
  discordId: string | null;
  discordUsername: string | null;
  kickId: string | null;
  kickUsername: string | null;
  points: number;
  xp: number;
  banned: boolean;
  timeoutUntil: Date | null;
  role: "PLAYER" | "ADMIN";
  accounts: {
    provider: string;
    updatedAt: Date;
  }[];
  casinoAccounts: {
    provider: string;
    username: string;
    email?: string | null;
    isVerified: boolean;
    verificationMethod?: string | null;
    verificationCode?: string | null;
    verifiedAt?: Date | null;
  }[];
};

export type OAuthProvider = "kick" | "discord";
export type CasinoProvider = "thrill" | "packdraw" | "shuffle";

const oauthProviders = new Set<string>(["kick", "discord"]);
const casinoProviders = new Set<string>(["thrill", "packdraw", "shuffle"]);
const adminEnvKeys = [
  "RANKBOARD_ADMIN_EMAILS",
  "RANKBOARD_ADMIN_KICK_USERNAMES",
  "RANKBOARD_ADMIN_KICK_IDS",
  "RANKBOARD_ADMIN_DISCORD_USERNAMES",
  "RANKBOARD_ADMIN_DISCORD_IDS",
];
const assignedAdminKickUsernames = new Set(["devuttkarsh"]);
const assignedAdminDiscordUsernames = new Set(["shinra.ae"]);

type AdminIdentityUser = {
  id: string;
  email?: string | null;
  discordId?: string | null;
  discordUsername?: string | null;
  kickId?: string | null;
  kickUsername?: string | null;
  role: "PLAYER" | "ADMIN";
};

function adminListFromEnv(key: string) {
  return new Set(
    (process.env[key] ?? "")
      .split(/[,\s]+/)
      .map((value) => value.trim().replace(/^@+/, "").toLowerCase())
      .filter(Boolean)
  );
}

function emailAdminListFromEnv(key: string) {
  return new Set(
    (process.env[key] ?? "")
      .split(/[,\s]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function hasConfiguredAdminAllowlist() {
  return (
    assignedAdminKickUsernames.size > 0 ||
    assignedAdminDiscordUsernames.size > 0 ||
    adminEnvKeys.some((key) => adminListFromEnv(key).size > 0)
  );
}

export function isConfiguredAdminIdentity(user: {
  email?: string | null;
  discordId?: string | null;
  discordUsername?: string | null;
  kickId?: string | null;
  kickUsername?: string | null;
}) {
  const email = user.email?.trim().toLowerCase();
  const discordId = user.discordId?.trim().toLowerCase();
  const discordUsername = user.discordUsername?.trim().replace(/^@+/, "").toLowerCase();
  const kickId = user.kickId?.trim().toLowerCase();
  const kickUsername = user.kickUsername?.trim().replace(/^@+/, "").toLowerCase();

  return Boolean(
    (email && emailAdminListFromEnv("RANKBOARD_ADMIN_EMAILS").has(email)) ||
      (discordId && adminListFromEnv("RANKBOARD_ADMIN_DISCORD_IDS").has(discordId)) ||
      (discordUsername &&
        (assignedAdminDiscordUsernames.has(discordUsername) ||
          adminListFromEnv("RANKBOARD_ADMIN_DISCORD_USERNAMES").has(discordUsername))) ||
      (kickId && adminListFromEnv("RANKBOARD_ADMIN_KICK_IDS").has(kickId)) ||
      (kickUsername &&
        (assignedAdminKickUsernames.has(kickUsername) ||
          adminListFromEnv("RANKBOARD_ADMIN_KICK_USERNAMES").has(kickUsername)))
  );
}

export async function reconcileConfiguredAdminRole<T extends AdminIdentityUser>(
  user: T
) {
  const nextRole = hasConfiguredAdminAllowlist()
    ? isConfiguredAdminIdentity(user)
      ? "ADMIN"
      : "PLAYER"
    : user.role;

  if (user.role === nextRole) {
    return user;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: nextRole },
  });

  return {
    ...user,
    role: nextRole,
  };
}

async function reconcileConfiguredAdminRoleById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    return null;
  }

  return reconcileConfiguredAdminRole(user);
}

function normalizeHandle(handle: string) {
  const cleaned = handle.trim().replace(/^@+/, "");
  const safe = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .slice(0, 32);

  return safe || "guest";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function displayNameFromEmail(email: string) {
  return email.split("@")[0]?.replace(/[^a-z0-9_.-]/gi, "").slice(0, 32) || "player";
}

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("base64url")}`;
}

async function verifyPassword(password: string, passwordHash: string | null) {
  if (!passwordHash) {
    return false;
  }

  const [scheme, salt, storedHash] = passwordHash.split(":");

  if (scheme !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const expected = Buffer.from(storedHash, "base64url");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function discordDisplayName(profile: DiscordProfile) {
  return profile.global_name?.trim() || profile.username.trim();
}

function discordAvatarUrl(profile: DiscordProfile) {
  if (!profile.avatar) {
    return null;
  }

  const extension = profile.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${extension}?size=128`;
}

function kickDisplayName(profile: KickProfile) {
  return profile.name.trim();
}

function normalizeCasinoUsername(username: string) {
  return username.trim().slice(0, 64);
}

function profileProviderFrom(user: SessionUser): AuthAccountPayload["profileProvider"] {
  const latestOauthProvider = user.accounts
    .filter((account) => account.provider === "kick" || account.provider === "discord")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]?.provider;

  if (latestOauthProvider === "kick" || latestOauthProvider === "discord") {
    return latestOauthProvider;
  }

  return "email";
}

export function accountFromUser(user: SessionUser): AuthAccountPayload {
  const casinos = {
    thrill: "",
    packdraw: "",
    shuffle: "",
  };

  for (const account of user.casinoAccounts) {
    if (account.provider in casinos) {
      casinos[account.provider as keyof typeof casinos] = account.username;
    }
  }

  const casinoAccounts = user.casinoAccounts.map((account) => ({
    provider: account.provider as "thrill" | "packdraw" | "shuffle",
    username: account.username,
    email: account.email ?? null,
    isVerified: Boolean(account.isVerified),
    verificationMethod: account.verificationMethod ?? null,
    verificationCode: account.verificationCode ?? null,
    verifiedAt: account.verifiedAt ? new Date(account.verifiedAt).toISOString() : null,
  }));

  const handle = user.kickUsername ?? user.displayName?.replace(/^@/, "") ?? "guest";

  return {
    handle: `@${handle}`,
    image: user.image ?? "",
    email: user.email ?? undefined,
    profileProvider: profileProviderFrom(user),
    points: user.points,
    xp: user.xp,
    streak: 1,
    inventory: [],
    connected: {
      kick: {
        connected: Boolean(user.kickUsername),
        username: user.kickUsername ?? "",
        id: user.kickId ?? "",
      },
      discord: {
        connected: Boolean(user.discordUsername),
        username: user.discordUsername ?? "",
        id: user.discordId ?? "",
      },
    },
    casinos,
    casinoAccounts,
    lifetimeWager: 0,
    watchMinutes: 0,
    banned: user.banned,
    timeoutUntil: user.timeoutUntil?.toISOString() ?? "",
    badges: user.role === "ADMIN" ? ["Admin", "Season 08"] : ["Season 08"],
  };
}

async function createSessionForUser(userId: string) {
  const expires = sessionExpiresAt();
  const sessionToken = createSessionToken();

  await prisma.session.create({
    data: {
      sessionToken,
      expires,
      userId,
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      accounts: true,
      casinoAccounts: true,
    },
  });

  const reconciledUser = await reconcileConfiguredAdminRole(user);

  return {
    sessionToken,
    expires,
    account: accountFromUser(reconciledUser),
  };
}

export async function createUserSession(handle: string) {
  const kickUsername = normalizeHandle(handle);
  const displayName = `@${kickUsername}`;

  const existingUser = await prisma.user.findFirst({
    where: { kickUsername },
    select: { id: true },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          displayName,
          kickUsername,
        },
        select: { id: true },
      })
    : await prisma.user.create({
        data: {
          displayName,
          kickUsername,
          name: displayName,
        },
        select: { id: true },
      });

  return createSessionForUser(user.id);
}

export async function createEmailPasswordSession({
  email,
  password,
  displayName,
  currentSessionToken,
}: {
  email: string;
  password: string;
  displayName?: string;
  currentSessionToken?: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const activeUserId = await getSessionUserId(currentSessionToken);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (existingUser?.passwordHash) {
    throw new Error("An account already exists for this email.");
  }

  if (existingUser && existingUser.id !== activeUserId) {
    throw new Error("An account already exists for this email.");
  }

  const cleanDisplayName =
    displayName?.trim().slice(0, 64) || displayNameFromEmail(normalizedEmail);
  const passwordHash = await hashPassword(password);

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          displayName: cleanDisplayName,
          name: cleanDisplayName,
        },
        select: { id: true },
      })
    : activeUserId
      ? await prisma.user.update({
          where: { id: activeUserId },
          data: {
            email: normalizedEmail,
            passwordHash,
            displayName: cleanDisplayName,
            name: cleanDisplayName,
          },
          select: { id: true },
        })
      : await prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            displayName: cleanDisplayName,
            name: cleanDisplayName,
          },
          select: { id: true },
        });

  await reconcileConfiguredAdminRoleById(user.id);
  return createSessionForUser(user.id);
}

export async function signInWithEmailPassword(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new Error("Email or password is incorrect.");
  }

  return createSessionForUser(user.id);
}

export async function getSessionAccount(sessionToken: string | undefined) {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        include: {
          accounts: true,
          casinoAccounts: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expires <= new Date()) {
    await prisma.session.delete({
      where: { sessionToken },
    });
    return null;
  }

  return accountFromUser(await reconcileConfiguredAdminRole(session.user));
}

export async function getSessionUserId(sessionToken: string | undefined) {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: {
      userId: true,
      expires: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expires <= new Date()) {
    await prisma.session.delete({
      where: { sessionToken },
    });
    return null;
  }

  return session.userId;
}

export async function updateUserCasinoAccounts(
  sessionToken: string | undefined,
  casinos: Partial<Record<CasinoProvider, string>>
) {
  const userId = await getSessionUserId(sessionToken);

  if (!userId) {
    throw new Error("Sign in to update your profile.");
  }

  const updates = Object.entries(casinos).filter(([provider]) =>
    casinoProviders.has(provider)
  ) as [CasinoProvider, string][];

  for (const [provider, rawUsername] of updates) {
    const username = normalizeCasinoUsername(String(rawUsername ?? ""));
    if (!username) {
      await unlinkCasinoAccount(userId, provider);
    } else {
      await linkCasinoAccount({
        userId,
        provider,
        username,
      });
    }
  }

  const account = await getSessionAccount(sessionToken);

  if (!account) {
    throw new Error("Session expired. Sign in again.");
  }

  return account;
}

export async function disconnectOAuthProvider(
  sessionToken: string | undefined,
  provider: OAuthProvider
) {
  const userId = await getSessionUserId(sessionToken);

  if (!userId) {
    throw new Error("Sign in to manage connected accounts.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      casinoAccounts: true,
    },
  });

  if (!user) {
    throw new Error("Session expired. Sign in again.");
  }

  const oauthAccountCount = user.accounts.filter((account) =>
    oauthProviders.has(account.provider)
  ).length;
  const hasPasswordLogin = Boolean(user.email && user.passwordHash);

  if (oauthAccountCount <= 1 && !hasPasswordLogin) {
    throw new Error("Add an email login before disconnecting your only connected account.");
  }

  const currentProfileProvider = profileProviderFrom(user);
  const nextDisplayName =
    provider === "kick"
      ? user.discordUsername ?? user.displayName
      : user.kickUsername ?? user.displayName;

  await prisma.$transaction([
    prisma.account.deleteMany({
      where: {
        userId,
        provider,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(provider === "kick"
          ? {
              kickId: null,
              kickUsername: null,
            }
          : {
              discordId: null,
              discordUsername: null,
            }),
        ...(currentProfileProvider === provider ? { image: null } : {}),
        ...(nextDisplayName
          ? { displayName: nextDisplayName, name: nextDisplayName }
          : {}),
      },
    }),
  ]);

  const account = await getSessionAccount(sessionToken);

  if (!account) {
    throw new Error("Session expired. Sign in again.");
  }

  return account;
}

export type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

export type DiscordTokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export type KickProfile = {
  user_id: number;
  name: string;
  email?: string | null;
  profile_picture?: string | null;
};

export type KickTokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
  scope?: string;
};

export async function createDiscordUserSession(
  profile: DiscordProfile,
  tokens: DiscordTokenSet,
  currentSessionToken: string | undefined
) {
  const displayName = discordDisplayName(profile);
  const username = profile.username.trim();
  const image = discordAvatarUrl(profile);
  const activeUserId = await getSessionUserId(currentSessionToken);
  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "discord",
        providerAccountId: profile.id,
      },
    },
    select: { userId: true },
  });
  const discordUser = await prisma.user.findUnique({
    where: { discordId: profile.id },
    select: { id: true },
  });

  const userId = linkedAccount?.userId ?? discordUser?.id ?? activeUserId;
  const expiresAt = tokens.expires_in
    ? Math.floor(Date.now() / 1000) + tokens.expires_in
    : null;

  const user = userId
    ? await prisma.user.update({
        where: { id: userId },
        data: {
          discordId: profile.id,
          discordUsername: username,
          displayName,
          name: displayName,
          image,
        },
        select: { id: true },
      })
    : await prisma.user.create({
        data: {
          discordId: profile.id,
          discordUsername: username,
          displayName,
          name: displayName,
          image,
        },
        select: { id: true },
      });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "discord",
        providerAccountId: profile.id,
      },
    },
    create: {
      userId: user.id,
      type: "oauth",
      provider: "discord",
      providerAccountId: profile.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      token_type: tokens.token_type,
      scope: tokens.scope,
    },
    update: {
      userId: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      token_type: tokens.token_type,
      scope: tokens.scope,
    },
  });

  await reconcileConfiguredAdminRoleById(user.id);
  return createSessionForUser(user.id);
}

export async function createKickUserSession(
  profile: KickProfile,
  tokens: KickTokenSet,
  currentSessionToken: string | undefined
) {
  const kickId = String(profile.user_id);
  const kickUsername = kickDisplayName(profile);
  const activeUserId = await getSessionUserId(currentSessionToken);
  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "kick",
        providerAccountId: kickId,
      },
    },
    select: { userId: true },
  });
  const kickUser = await prisma.user.findUnique({
    where: { kickId },
    select: { id: true },
  });

  const userId = linkedAccount?.userId ?? kickUser?.id ?? activeUserId;
  const expiresAt = tokens.expires_in
    ? Math.floor(Date.now() / 1000) + tokens.expires_in
    : null;

  const user = userId
    ? await prisma.user.update({
        where: { id: userId },
        data: {
          kickId,
          kickUsername,
          displayName: kickUsername,
          name: kickUsername,
          image: profile.profile_picture ?? undefined,
        },
        select: { id: true },
      })
    : await prisma.user.create({
        data: {
          kickId,
          kickUsername,
          displayName: kickUsername,
          name: kickUsername,
          image: profile.profile_picture ?? undefined,
        },
        select: { id: true },
      });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: "kick",
        providerAccountId: kickId,
      },
    },
    create: {
      userId: user.id,
      type: "oauth",
      provider: "kick",
      providerAccountId: kickId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      token_type: tokens.token_type,
      scope: tokens.scope,
    },
    update: {
      userId: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      token_type: tokens.token_type,
      scope: tokens.scope,
    },
  });

  await reconcileConfiguredAdminRoleById(user.id);
  return createSessionForUser(user.id);
}

export async function deleteUserSession(sessionToken: string | undefined) {
  if (!sessionToken) {
    return;
  }

  await prisma.session.deleteMany({
    where: { sessionToken },
  });
}

export function setSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expires: Date
) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}
