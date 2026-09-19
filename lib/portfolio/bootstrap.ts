import { eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { portfolioProfile, portfolioProjects } from "@/lib/db/schema";
import { DEFAULT_PROFILE, DEFAULT_PROJECTS } from "./defaults";

function profileValues(now: Date) {
  return {
    id: DEFAULT_PROFILE.id,
    name: DEFAULT_PROFILE.name,
    tagline: DEFAULT_PROFILE.tagline,
    about: DEFAULT_PROFILE.about,
    skillsJson: JSON.stringify(DEFAULT_PROFILE.skills),
    contactEmail: DEFAULT_PROFILE.contactEmail,
    contactNote: DEFAULT_PROFILE.contactNote,
    updatedAt: now,
  };
}

function projectValues(
  project: (typeof DEFAULT_PROJECTS)[number],
  now: Date,
) {
  return {
    id: project.id,
    title: project.title,
    category: project.category,
    year: project.year,
    description: project.description,
    imageKey: project.imageKey,
    imageName: project.imageName,
    linkUrl: project.linkUrl,
    sortOrder: project.sortOrder,
    isPublished: project.isPublished,
    createdAt: now,
    updatedAt: now,
  };
}

export async function bootstrapPortfolio() {
  const now = new Date();
  const [existing] = await db
    .select()
    .from(portfolioProfile)
    .where(eq(portfolioProfile.id, DEFAULT_PROFILE.id))
    .limit(1);

  const needsStarterContent =
    !existing ||
    existing.name === "Spleckt" ||
    existing.contactEmail === "hello@spleckt.com";

  if (!existing) {
    await db.insert(portfolioProfile).values(profileValues(now));
  } else if (needsStarterContent) {
    await db
      .update(portfolioProfile)
      .set(profileValues(now))
      .where(eq(portfolioProfile.id, DEFAULT_PROFILE.id));
  } else if (existing.contactNote.includes("LinkedIn")) {
    await db
      .update(portfolioProfile)
      .set({
        contactNote: DEFAULT_PROFILE.contactNote,
        updatedAt: now,
      })
      .where(eq(portfolioProfile.id, DEFAULT_PROFILE.id));
  }

  if (needsStarterContent) {
    await db
      .delete(portfolioProjects)
      .where(
        notInArray(
          portfolioProjects.id,
          DEFAULT_PROJECTS.map((project) => project.id),
        ),
      );
  }

  const rows = await db.select({ id: portfolioProjects.id }).from(portfolioProjects);
  const ids = new Set(rows.map((row) => row.id));
  const missing = DEFAULT_PROJECTS.filter((project) => !ids.has(project.id));
  if (missing.length === 0) return;

  await db.insert(portfolioProjects).values(
    missing.map((project) => projectValues(project, now)),
  );
}
