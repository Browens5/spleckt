export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { splats } from "@/lib/db/schema";
import { defaultExperienceSettings } from "@/lib/default-settings";
import { createId } from "@/lib/ids";
import { getSession, isAdmin } from "@/lib/session";
import { publicAssetUrl } from "@/lib/storage";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  category: z
    .enum(["real-estate", "construction", "business", "home", "scene", "other"])
    .optional(),
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative().optional(),
  contentType: z.string().optional(),
  thumbnailKey: z.string().optional(),
  isFeatured: z.boolean().optional(),
  ownerId: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = isAdmin(session.user.role)
    ? await db.select().from(splats).orderBy(splats.createdAt)
    : await db
        .select()
        .from(splats)
        .where(eq(splats.ownerId, session.user.id))
        .orderBy(splats.createdAt);

  return NextResponse.json({
    splats: rows
      .reverse()
      .map((row) => ({
        ...row,
        fileUrl: publicAssetUrl(row.fileKey),
        thumbnailUrl: row.thumbnailKey
          ? publicAssetUrl(row.thumbnailKey)
          : null,
      })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  const ownerId =
    isAdmin(session.user.role) && data.ownerId
      ? data.ownerId
      : session.user.id;

  if (!isAdmin(session.user.role) && !data.fileKey.startsWith(`splats/${session.user.id}/`)) {
    return NextResponse.json({ error: "Forbidden file key" }, { status: 403 });
  }

  const id = createId();
  const [row] = await db
    .insert(splats)
    .values({
      id,
      ownerId,
      title: data.title,
      description: data.description ?? "",
      category: data.category ?? "other",
      fileKey: data.fileKey,
      fileName: data.fileName,
      fileSize: data.fileSize ?? 0,
      contentType: data.contentType ?? "application/octet-stream",
      thumbnailKey: data.thumbnailKey,
      settingsJson: JSON.stringify(defaultExperienceSettings),
      isFeatured: isAdmin(session.user.role) ? Boolean(data.isFeatured) : false,
    })
    .returning();

  return NextResponse.json({
    splat: {
      ...row,
      fileUrl: publicAssetUrl(row.fileKey),
      thumbnailUrl: row.thumbnailKey ? publicAssetUrl(row.thumbnailKey) : null,
    },
  });
}
