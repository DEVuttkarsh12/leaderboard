import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  getSessionAccount,
  updateUserCasinoAccounts,
} from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const account = await getSessionAccount(sessionTokenFrom(request));
  if (!account) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    account,
    casinos: account.casinos,
    casinoAccounts: account.casinoAccounts,
  });
}

const profileSchema = z.object({
  casinos: z
    .object({
      thrill: z.string().max(64).optional(),
      packdraw: z.string().max(64).optional(),
      shuffle: z.string().max(64).optional(),
    })
    .optional(),
});

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function PATCH(request: NextRequest) {
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !parsed.data.casinos) {
    return NextResponse.json(
      { error: "Enter valid profile details." },
      { status: 400 }
    );
  }

  try {
    const account = await updateUserCasinoAccounts(
      sessionTokenFrom(request),
      parsed.data.casinos
    );

    return NextResponse.json({ account });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Profile update failed.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
