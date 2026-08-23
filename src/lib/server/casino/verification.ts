import { prisma } from "@/lib/server/db/prisma";
import { getLeaderboardRouteResult } from "@/lib/server/leaderboard/service";
import type { NormalizedLeaderboardUser } from "@/types/leaderboard";
import type { CasinoProvider } from "@/lib/server/auth/session";

export type CasinoPlayerValidationResult = {
  exists: boolean;
  foundInLeaderboard: boolean;
  score?: number;
  wagerAmount?: number;
  message?: string;
};

export function generateVerificationCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `RANK-${digits}`;
}

export function normalizeCasinoHandle(value: string): string {
  return value.trim().slice(0, 64);
}

export function normalizeCasinoEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, 128);
}

/**
 * Validates if the casino player exists upstream or in the leaderboard affiliate pool
 */
export async function validateCasinoPlayer(
  provider: CasinoProvider,
  username: string
): Promise<CasinoPlayerValidationResult> {
  const cleanUsername = normalizeCasinoHandle(username);
  if (!cleanUsername || cleanUsername.length < 2) {
    return {
      exists: false,
      foundInLeaderboard: false,
      message: "Please enter a valid casino username (at least 2 characters).",
    };
  }

  // If Shuffle: check active leaderboard & affiliate data
  if (provider === "shuffle") {
    try {
      const result = await getLeaderboardRouteResult();
      if (result.status === 200 && !("error" in result.body)) {
        const body = result.body as { users?: NormalizedLeaderboardUser[] };
        const players = body.users ?? [];
        const found = players.find(
          (p) =>
            (p.username && p.username.toLowerCase() === cleanUsername.toLowerCase()) ||
            (p.kickUsername && p.kickUsername.toLowerCase() === cleanUsername.toLowerCase()) ||
            (p.name && p.name.toLowerCase() === cleanUsername.toLowerCase())
        );

        if (found) {
          return {
            exists: true,
            foundInLeaderboard: true,
            score: found.score,
            wagerAmount: found.points ?? undefined,
          };
        }
      }
    } catch {
      // Fallback if leaderboard service unreachable
    }

    return {
      exists: true,
      foundInLeaderboard: false,
      message: "Player handle format valid. Not currently in top wager snapshot.",
    };
  }

  // Thrill / Packdraw format validation
  const isValidFormat = /^[a-zA-Z0-9_.-]{2,32}$/.test(cleanUsername);
  if (!isValidFormat) {
    return {
      exists: false,
      foundInLeaderboard: false,
      message: `Invalid ${provider} username format. Use 2-32 letters, numbers, underscores or dashes.`,
    };
  }

  return {
    exists: true,
    foundInLeaderboard: false,
  };
}

/**
 * Securely links and handles verification for a casino account
 */
export async function linkCasinoAccount({
  userId,
  provider,
  username,
  email,
}: {
  userId: string;
  provider: CasinoProvider;
  username: string;
  email?: string;
}) {
  const cleanUsername = normalizeCasinoHandle(username);
  const cleanEmail = email ? normalizeCasinoEmail(email) : undefined;

  if (!cleanUsername) {
    throw new Error("Enter a valid casino username.");
  }

  // 1. Anti-theft Check: Check if another user has already linked/claimed this username
  const existingUsername = await prisma.casinoAccount.findFirst({
    where: {
      provider,
      username: { equals: cleanUsername, mode: "insensitive" },
      userId: { not: userId },
    },
  });

  if (existingUsername) {
    throw new Error(
      `The ${provider} username "${cleanUsername}" is already linked to another player.`
    );
  }

  // 2. Anti-theft Check: If email provided, check if another user has claimed this email
  if (cleanEmail) {
    const existingEmail = await prisma.casinoAccount.findFirst({
      where: {
        provider,
        email: { equals: cleanEmail, mode: "insensitive" },
        userId: { not: userId },
      },
    });

    if (existingEmail) {
      throw new Error(
        `The ${provider} email "${cleanEmail}" is already linked to another player.`
      );
    }
  }

  // 3. Fetch user details to evaluate auto-verification
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { accounts: true },
  });

  let isVerified = false;
  let verificationMethod: string | null = null;
  let verifiedAt: Date | null = null;
  let verificationCode: string | null = generateVerificationCode();

  // Verification Check 1: Kick OAuth Match
  // If user is authenticated with Kick, and the Kick username matches the casino username
  if (
    user.kickUsername &&
    user.kickUsername.trim().toLowerCase() === cleanUsername.toLowerCase()
  ) {
    isVerified = true;
    verificationMethod = "KICK_OAUTH";
    verifiedAt = new Date();
    verificationCode = null;
  }

  // Verification Check 2: Casino Email matches verified User email
  if (!isVerified && cleanEmail && user.email) {
    if (cleanEmail.toLowerCase() === user.email.trim().toLowerCase()) {
      isVerified = true;
      verificationMethod = "EMAIL_MATCH";
      verifiedAt = new Date();
      verificationCode = null;
    }
  }

  // Verification Check 3: Check if Shuffle leaderboard entry explicitly links kickUsername to this casino username
  if (!isVerified && user.kickUsername && provider === "shuffle") {
    try {
      const result = await getLeaderboardRouteResult();
      if (result.status === 200 && !("error" in result.body)) {
        const body = result.body as { users?: NormalizedLeaderboardUser[] };
        const players = body.users ?? [];
        const match = players.find(
          (p) =>
            p.kickUsername &&
            p.kickUsername.toLowerCase() === user.kickUsername?.toLowerCase() &&
            p.username &&
            p.username.toLowerCase() === cleanUsername.toLowerCase()
        );
        if (match) {
          isVerified = true;
          verificationMethod = "KICK_OAUTH";
          verifiedAt = new Date();
          verificationCode = null;
        }
      }
    } catch {
      // Ignore
    }
  }

  // Upsert the CasinoAccount
  const account = await prisma.casinoAccount.upsert({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    create: {
      userId,
      provider,
      username: cleanUsername,
      email: cleanEmail,
      isVerified,
      verificationMethod: isVerified ? verificationMethod : "PENDING_VERIFICATION",
      verificationCode: isVerified ? null : verificationCode,
      verifiedAt,
    },
    update: {
      username: cleanUsername,
      email: cleanEmail,
      isVerified,
      verificationMethod: isVerified ? verificationMethod : "PENDING_VERIFICATION",
      verificationCode: isVerified ? null : verificationCode,
      verifiedAt,
    },
  });

  return account;
}

/**
 * Verify account using challenge code
 */
export async function verifyCasinoCode({
  userId,
  provider,
  code,
}: {
  userId: string;
  provider: CasinoProvider;
  code: string;
}) {
  const account = await prisma.casinoAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  });

  if (!account) {
    throw new Error(`No ${provider} account found to verify.`);
  }

  if (account.isVerified) {
    return account;
  }

  const cleanCode = code.trim().toUpperCase();
  if (
    !account.verificationCode ||
    account.verificationCode.toUpperCase() !== cleanCode
  ) {
    throw new Error("Invalid verification code. Please check and try again.");
  }

  return prisma.casinoAccount.update({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    data: {
      isVerified: true,
      verificationMethod: "CODE_VERIFIED",
      verificationCode: null,
      verifiedAt: new Date(),
    },
  });
}

/**
 * Trigger an instant re-check for auto-verification (e.g. after connecting Kick or Email)
 */
export async function recheckAutoVerification(
  userId: string,
  provider: CasinoProvider
) {
  const account = await prisma.casinoAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  });

  if (!account || account.isVerified) {
    return account;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { accounts: true },
  });

  let isVerified = false;
  let verificationMethod: string | null = null;

  if (
    user.kickUsername &&
    user.kickUsername.trim().toLowerCase() === account.username.toLowerCase()
  ) {
    isVerified = true;
    verificationMethod = "KICK_OAUTH";
  } else if (
    account.email &&
    user.email &&
    account.email.toLowerCase() === user.email.trim().toLowerCase()
  ) {
    isVerified = true;
    verificationMethod = "EMAIL_MATCH";
  }

  if (isVerified) {
    return prisma.casinoAccount.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: {
        isVerified: true,
        verificationMethod,
        verificationCode: null,
        verifiedAt: new Date(),
      },
    });
  }

  return account;
}

/**
 * Remove / unlink casino account
 */
export async function unlinkCasinoAccount(
  userId: string,
  provider: CasinoProvider
) {
  return prisma.casinoAccount.deleteMany({
    where: {
      userId,
      provider,
    },
  });
}
