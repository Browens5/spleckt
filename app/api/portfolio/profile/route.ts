export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { portfolioProfile } from "@/lib/db/schema";
import { bootstrapPortfolio } from "@/lib/portfolio/bootstrap";
import { DEFAULT_PROFILE } from "@/lib/portfolio/defaults";
import { mapProfile, parseSkills } from "@/lib/portfolio/map";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { canManagePortfolio, getSession } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  tagline: z.string().max(240).optional(),
  about: z.string().max(4000).optional(),
  skills: z.union([z.array(z.string()), z.string()]).optional(),
  contactEmail: z.string().max(160).optional(),
  contactNote: z.string().max(1000).optional(),
});

export async function GET() {
  await ensureSchema();
  await bootstrapPortfolio();

  const [row] = await db
    .select()
    .from(portfolioProfile)
    .where(eq(portfolioProfile.id, DEFAULT_PROFILE.id))
    .limit(1);

  return NextResponse.json({
    profile: row ? mapProfile(row) : { ...DEFAULT_PROFILE, updatedAt: null },
  });
}

export async function PATCH(request: NextRequest) {
  await ensureSchema();
  await bootstrapPortfolio();

  const session = await getSession();
  if (!session || !canManagePortfolio(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  const skills = data.skills !== undefined ? parseSkills(data.skills) : undefined;

  const [row] = await db
    .update(portfolioProfile)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.tagline !== undefined ? { tagline: data.tagline } : {}),
      ...(data.about !== undefined ? { about: data.about } : {}),
      ...(skills !== undefined ? { skillsJson: JSON.stringify(skills) } : {}),
      ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail } : {}),
      ...(data.contactNote !== undefined ? { contactNote: data.contactNote } : {}),
      updatedAt: new Date(),
    })
    .where(eq(portfolioProfile.id, DEFAULT_PROFILE.id))
    .returning();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: mapProfile(row) });
}
