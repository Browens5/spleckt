import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { splats } from "@/lib/db/schema";
import { getSession, isAdmin } from "@/lib/session";
import { publicAssetUrl } from "@/lib/storage";

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  category: z
    .enum(["real-estate", "construction", "business", "home", "scene", "other"])
    .optional(),
  thumbnailKey: z.string().nullable().optional(),
  settingsJson: z.string().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["processing", "ready", "archived"]).optional(),
});

async function getOwnedSplat(id: string, userId: string, role?: string | null) {
  const [row] = await db.select().from(splats).where(eq(splats.id, id)).limit(1);
  if (!row) return null;
  if (!isAdmin(role) && row.ownerId !== userId) return null;
  return row;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const row = await getOwnedSplat(id, session.user.id, session.user.role);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    splat: {
      ...row,
      fileUrl: publicAssetUrl(row.fileKey),
      thumbnailUrl: row.thumbnailKey ? publicAssetUrl(row.thumbnailKey) : null,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getOwnedSplat(id, session.user.id, session.user.role);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  const [row] = await db
    .update(splats)
    .set({
      title: data.title,
      description: data.description,
      category: data.category,
      thumbnailKey: data.thumbnailKey === undefined ? undefined : data.thumbnailKey,
      settingsJson: data.settingsJson,
      status: data.status,
      isFeatured: isAdmin(session.user.role)
        ? data.isFeatured
        : existing.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(splats.id, id))
    .returning();

  return NextResponse.json({
    splat: {
      ...row,
      fileUrl: publicAssetUrl(row.fileKey),
      thumbnailUrl: row.thumbnailKey ? publicAssetUrl(row.thumbnailKey) : null,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await getOwnedSplat(id, session.user.id, session.user.role);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(splats).where(eq(splats.id, id));
  return NextResponse.json({ ok: true });
}
