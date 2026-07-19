export const dynamic = "force-dynamic";

import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { splats } from "@/lib/db/schema";
import { publicAssetUrl } from "@/lib/storage";

export async function GET() {
  try {
    await ensureSchema();
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
  } catch (error) {
    console.error("featured route failed", error);
    return NextResponse.json(
      {
        splats: [],
        error:
          error instanceof Error ? error.message : "Failed to load featured splats",
      },
      { status: 503 },
    );
  }
}
