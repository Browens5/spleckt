import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { getSession, isAdmin } from "@/lib/session";
import { publicAssetUrl } from "@/lib/storage";

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  posterKey: z.string().nullable().optional(),
  splatId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const [row] = await db
    .update(mediaAssets)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(mediaAssets.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    media: {
      ...row,
      fileUrl: publicAssetUrl(row.fileKey),
      posterUrl: row.posterKey ? publicAssetUrl(row.posterKey) : null,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return NextResponse.json({ ok: true });
}
