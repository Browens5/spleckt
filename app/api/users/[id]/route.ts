export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { canManageUsers, getSession } from "@/lib/session";
import { USER_ROLES, normalizeRole } from "@/lib/types";

const updateSchema = z.object({
  role: z.enum(["viewer", "editor", "admin"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Role must be one of: ${USER_ROLES.join(", ")}` },
      { status: 400 },
    );
  }

  // Prevent an admin from locking themselves out if they are the only admin.
  if (id === session.user.id && parsed.data.role !== "admin") {
    const admins = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.role, "admin"));
    if (admins.length <= 1) {
      return NextResponse.json(
        { error: "You are the only admin. Promote someone else before changing your role." },
        { status: 400 },
      );
    }
  }

  const [row] = await db
    .update(user)
    .set({
      role: parsed.data.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, id))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });

  if (!row) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...row,
      role: normalizeRole(row.role),
    },
  });
}
