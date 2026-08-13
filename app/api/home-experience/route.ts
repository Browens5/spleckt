export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { ensureSchema } from "@/lib/db/ensure-schema";
import {
  DEFAULT_HOME_EXPERIENCE,
  homeExperienceSchema,
  parseHomeExperience,
} from "@/lib/home-experience";
import { getSession, isAdmin } from "@/lib/session";

const SETTINGS_KEY = "homeExperience";

async function readSettings() {
  await ensureSchema();
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTINGS_KEY))
    .limit(1);

  if (!rows[0]) return DEFAULT_HOME_EXPERIENCE;
  try {
    return parseHomeExperience(JSON.parse(rows[0].valueJson));
  } catch {
    return DEFAULT_HOME_EXPERIENCE;
  }
}

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("home-experience GET failed", error);
    return NextResponse.json({ settings: DEFAULT_HOME_EXPERIENCE });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = homeExperienceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await ensureSchema();
  const settings = parseHomeExperience(parsed.data);
  const valueJson = JSON.stringify(settings);
  const now = new Date();

  const existing = await db
    .select({ key: siteSettings.key })
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTINGS_KEY))
    .limit(1);

  if (existing[0]) {
    await db
      .update(siteSettings)
      .set({ valueJson, updatedAt: now })
      .where(eq(siteSettings.key, SETTINGS_KEY));
  } else {
    await db.insert(siteSettings).values({
      key: SETTINGS_KEY,
      valueJson,
      updatedAt: now,
    });
  }

  return NextResponse.json({ settings });
}
