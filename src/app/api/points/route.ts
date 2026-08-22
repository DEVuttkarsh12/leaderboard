import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, SESSION_COOKIE } from "@/lib/server/auth/session";
import { getUserTransactions } from "@/lib/server/points/service";
import { prisma } from "@/lib/server/db/prisma";

export const dynamic = "force-dynamic";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(sessionTokenFrom(request));
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your points." }, { status: 401 });
  }

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, xp: true },
    }),
    getUserTransactions(userId, 30),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  return NextResponse.json({ points: user.points, xp: user.xp, transactions });
}
