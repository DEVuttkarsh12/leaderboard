import { NextRequest, NextResponse } from "next/server";
import { listAdminUsers, requireAdminUser } from "@/lib/server/admin/users";
import { SESSION_COOKIE } from "@/lib/server/auth/session";

function sessionTokenFrom(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser(sessionTokenFrom(request));
    const users = await listAdminUsers(request.nextUrl.searchParams.get("q") ?? "");

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin access required.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
