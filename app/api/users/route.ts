export const dynamic = "force-dynamic";

import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { canManageUsers, getSession } from "@/lib/session";
import { normalizeRole } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admins manage everyone; editors can list users to assign splat ownership.
  if (!canManageUsers(session.user.role) && normalizeRole(session.user.role) !== "editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.name));

  return NextResponse.json({
    users: rows.map((row) => ({
      ...row,
      role: normalizeRole(row.role),
    })),
  });
}
