import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { getSession, isAdmin } from "@/lib/session";
import { publicAssetUrl } from "@/lib/storage";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  kind: z.enum(["video", "image", "splat"]),
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative().optional(),
  contentType: z.string().optional(),
  posterKey: z.string().optional(),
  splatId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const publishedOnly =
    request.nextUrl.searchParams.get("published") === "1" ||
    request.nextUrl.searchParams.get("published") === "true";

  if (publishedOnly) {
    const rows = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.isPublished, true))
      .orderBy(desc(mediaAssets.sortOrder), desc(mediaAssets.createdAt));

    return NextResponse.json({
      media: rows.map((row) => ({
        ...row,
        fileUrl: publicAssetUrl(row.fileKey),
        posterUrl: row.posterKey ? publicAssetUrl(row.posterKey) : null,
      })),
    });
  }

  const session = await getSession();
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.sortOrder), desc(mediaAssets.createdAt));

  return NextResponse.json({
    media: rows.map((row) => ({
      ...row,
      fileUrl: publicAssetUrl(row.fileKey),
      posterUrl: row.posterKey ? publicAssetUrl(row.posterKey) : null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  const [row] = await db
    .insert(mediaAssets)
    .values({
      id: createId(),
      uploadedBy: session.user.id,
      title: data.title,
      description: data.description ?? "",
      kind: data.kind,
      fileKey: data.fileKey,
      fileName: data.fileName,
      fileSize: data.fileSize ?? 0,
      contentType: data.contentType ?? "application/octet-stream",
      posterKey: data.posterKey,
      splatId: data.splatId,
      sortOrder: data.sortOrder ?? 0,
      isPublished: data.isPublished ?? true,
    })
    .returning();

  return NextResponse.json({
    media: {
      ...row,
      fileUrl: publicAssetUrl(row.fileKey),
      posterUrl: row.posterKey ? publicAssetUrl(row.posterKey) : null,
    },
  });
}
