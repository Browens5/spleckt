import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { splats } from "@/lib/db/schema";
import { publicAssetUrl } from "@/lib/storage";

export async function GET() {
  const rows = await db
    .select()
    .from(splats)
    .where(and(eq(splats.isFeatured, true), eq(splats.status, "ready")))
    .orderBy(desc(splats.updatedAt))
    .limit(12);

  return NextResponse.json({
    splats: rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      fileUrl: publicAssetUrl(row.fileKey),
      thumbnailUrl: row.thumbnailKey ? publicAssetUrl(row.thumbnailKey) : null,
    })),
  });
}
