export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { portfolioProjects } from "@/lib/db/schema";
import { mapProject } from "@/lib/portfolio/map";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { canManagePortfolio, getSession } from "@/lib/session";

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  category: z.string().max(80).optional(),
  year: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
  imageKey: z.string().min(1).nullable().optional(),
  imageName: z.string().max(240).nullable().optional(),
  contentType: z.string().max(120).nullable().optional(),
  linkUrl: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const session = await getSession();
  if (!session || !canManagePortfolio(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  const patch: Partial<typeof portfolioProjects.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.title !== undefined) patch.title = data.title;
  if (data.category !== undefined) patch.category = data.category;
  if (data.year !== undefined) patch.year = data.year;
  if (data.description !== undefined) patch.description = data.description;
  if (data.linkUrl !== undefined) patch.linkUrl = data.linkUrl;
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
  if (data.isPublished !== undefined) patch.isPublished = data.isPublished;
  if (data.imageKey !== undefined) {
    patch.imageKey = data.imageKey;
    if (data.imageName !== undefined) patch.imageName = data.imageName;
    if (data.contentType !== undefined) patch.contentType = data.contentType;
  }

  const [row] = await db
    .update(portfolioProjects)
    .set(patch)
    .where(eq(portfolioProjects.id, id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ project: mapProject(row) });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const session = await getSession();
  if (!session || !canManagePortfolio(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await db.delete(portfolioProjects).where(eq(portfolioProjects.id, id));
  return NextResponse.json({ ok: true });
}
