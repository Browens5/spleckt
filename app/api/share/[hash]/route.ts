export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shareLinks, splats } from "@/lib/db/schema";
import { defaultExperienceSettings } from "@/lib/default-settings";
import { publicAssetUrl } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ hash: string }> },
) {
  const { hash } = await context.params;
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.hash, hash))
    .limit(1);

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [splat] = await db
    .select()
    .from(splats)
    .where(eq(splats.id, link.splatId))
    .limit(1);

  if (!splat || splat.status === "archived") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let settings = defaultExperienceSettings;
  if (splat.settingsJson) {
    try {
      settings = JSON.parse(splat.settingsJson);
    } catch {
      // keep defaults
    }
  }

  return NextResponse.json({
    splat: {
      id: splat.id,
      title: splat.title,
      description: splat.description,
      category: splat.category,
      fileUrl: publicAssetUrl(splat.fileKey),
      thumbnailUrl: splat.thumbnailKey
        ? publicAssetUrl(splat.thumbnailKey)
        : null,
      settings,
    },
  });
}
