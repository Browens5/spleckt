export const dynamic = "force-dynamic";

import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { portfolioProfile, portfolioProjects } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { bootstrapPortfolio } from "@/lib/portfolio/bootstrap";
import { DEFAULT_PROFILE } from "@/lib/portfolio/defaults";
import { mapProfile, mapProject } from "@/lib/portfolio/map";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { canManagePortfolio, getSession } from "@/lib/session";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  category: z.string().max(80).optional(),
  year: z.string().max(20).optional(),
  description: z.string().max(2000).optional(),
  imageKey: z.string().min(1).optional(),
  imageName: z.string().max(240).optional(),
  contentType: z.string().max(120).optional(),
  linkUrl: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  await ensureSchema();
  await bootstrapPortfolio();

  const session = await getSession();
  const canEdit = Boolean(session && canManagePortfolio(session.user.role));
  const includeDrafts =
    canEdit &&
    (request.nextUrl.searchParams.get("all") === "1" ||
      request.nextUrl.searchParams.get("all") === "true");

  const projectRows = includeDrafts
    ? await db
        .select()
        .from(portfolioProjects)
        .orderBy(asc(portfolioProjects.sortOrder), asc(portfolioProjects.createdAt))
    : await db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.isPublished, true))
        .orderBy(asc(portfolioProjects.sortOrder), asc(portfolioProjects.createdAt));

  const [profileRow] = await db
    .select()
    .from(portfolioProfile)
    .where(eq(portfolioProfile.id, DEFAULT_PROFILE.id))
    .limit(1);

  return NextResponse.json({
    canEdit,
    profile: profileRow
      ? mapProfile(profileRow)
      : { ...DEFAULT_PROFILE, updatedAt: null },
    projects: projectRows.map(mapProject),
  });
}

export async function POST(request: NextRequest) {
  await ensureSchema();
  const session = await getSession();
  if (!session || !canManagePortfolio(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  const [row] = await db
    .insert(portfolioProjects)
    .values({
      id: createId(),
      title: data.title,
      category: data.category ?? "",
      year: data.year ?? "",
      description: data.description ?? "",
      imageKey: data.imageKey,
      imageName: data.imageName,
      contentType: data.contentType,
      linkUrl: data.linkUrl ?? null,
      sortOrder: data.sortOrder ?? Date.now(),
      isPublished: data.isPublished ?? true,
    })
    .returning();

  return NextResponse.json({ project: mapProject(row) });
}
