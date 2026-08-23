import { prisma } from "@/lib/server/db/prisma";

export type AdminUserSummary = {
  id: string;
  handle: string;
  email: string;
  image: string;
  points: number;
  xp: number;
  role: "PLAYER" | "ADMIN";
  banned: boolean;
  bannedReason: string;
  timeoutUntil: string;
  connected: {
    kick: {
      connected: boolean;
      username: string;
      id: string;
    };
    discord: {
      connected: boolean;
      username: string;
      id: string;
    };
  };
  casinos: {
    thrill: string;
    packdraw: string;
    shuffle: string;
  };
  casinoAccounts?: {
    provider: string;
    username: string;
    email?: string | null;
    isVerified: boolean;
    verificationMethod?: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
};

type AdminUserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  displayName: string | null;
  discordId: string | null;
  discordUsername: string | null;
  kickId: string | null;
  kickUsername: string | null;
  points: number;
  xp: number;
  role: "PLAYER" | "ADMIN";
  banned: boolean;
  bannedReason: string | null;
  timeoutUntil: Date | null;
  casinoAccounts: {
    provider: string;
    username: string;
    email?: string | null;
    isVerified: boolean;
    verificationMethod?: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export async function requireAdminUser(sessionToken: string | undefined) {
  if (!sessionToken) {
    throw new Error("Admin login required.");
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: true,
    },
  });

  if (!session || session.expires <= new Date()) {
    throw new Error("Admin login required.");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Admin access required.");
  }

  return session.user;
}

function userHandle(user: AdminUserRecord) {
  const handle =
    user.kickUsername ??
    user.discordUsername ??
    user.displayName?.replace(/^@/, "") ??
    user.email?.split("@")[0] ??
    user.name ??
    "player";

  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function adminUserSummary(user: AdminUserRecord): AdminUserSummary {
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

  return {
    id: user.id,
    handle: userHandle(user),
    email: user.email ?? "",
    image: user.image ?? "",
    points: user.points,
    xp: user.xp,
    role: user.role,
    banned: user.banned,
    bannedReason: user.bannedReason ?? "",
    timeoutUntil: user.timeoutUntil?.toISOString() ?? "",
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
    casinoAccounts: user.casinoAccounts.map((c) => ({
      provider: c.provider,
      username: c.username,
      email: c.email ?? null,
      isVerified: Boolean(c.isVerified),
      verificationMethod: c.verificationMethod ?? null,
    })),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listAdminUsers(query: string) {
  const trimmed = query.trim();
  const where = trimmed
    ? {
        OR: [
          { email: { contains: trimmed, mode: "insensitive" as const } },
          { displayName: { contains: trimmed, mode: "insensitive" as const } },
          { discordUsername: { contains: trimmed, mode: "insensitive" as const } },
          { kickUsername: { contains: trimmed, mode: "insensitive" as const } },
          { casinoAccounts: { some: { username: { contains: trimmed, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    include: {
      casinoAccounts: true,
    },
    orderBy: [{ role: "desc" }, { updatedAt: "desc" }],
    take: 30,
  });

  return users.map(adminUserSummary);
}

export async function updateAdminUser(
  userId: string,
  data: {
    points?: number;
    xp?: number;
    banned?: boolean;
    bannedReason?: string;
    timeoutUntil?: Date | null;
    role?: "PLAYER" | "ADMIN";
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      casinoAccounts: true,
    },
  });

  return adminUserSummary(user);
}
