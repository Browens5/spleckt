export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shareLinks, splats } from "@/lib/db/schema";
import { createId, createShareHash } from "@/lib/ids";
import { getSession, isAdmin } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [splat] = await db.select().from(splats).where(eq(splats.id, id)).limit(1);
  if (!splat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isAdmin(session.user.role) && splat.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const links = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.splatId, id));

  return NextResponse.json({
    links: links.map((link) => ({
      ...link,
      url: `/s/${link.hash}`,
    })),
  });
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [splat] = await db.select().from(splats).where(eq(splats.id, id)).limit(1);
  if (!splat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isAdmin(session.user.role) && splat.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hash = createShareHash();
  const [link] = await db
    .insert(shareLinks)
    .values({
      id: createId(),
      splatId: id,
      hash,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json({
    link: {
      ...link,
      url: `/s/${link.hash}`,
    },
  });
}
