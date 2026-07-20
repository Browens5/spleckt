export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shareLinks, splats } from "@/lib/db/schema";
import { createId, createShareHash } from "@/lib/ids";
import { canEditSplats, getSession, isAdmin } from "@/lib/session";

async function getAccessibleSplat(
  id: string,
  userId: string,
  role?: string | null,
) {
  const [splat] = await db.select().from(splats).where(eq(splats.id, id)).limit(1);
  if (!splat) return null;
  if (!isAdmin(role) && splat.ownerId !== userId) return null;
  return splat;
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
  const splat = await getAccessibleSplat(id, session.user.id, session.user.role);
  if (!splat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const links = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.splatId, id));

  return NextResponse.json({
    canCreate: canEditSplats(session.user.role),
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

  if (!canEditSplats(session.user.role)) {
    return NextResponse.json(
      { error: "Viewers cannot create share links." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const splat = await getAccessibleSplat(id, session.user.id, session.user.role);
  if (!splat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
