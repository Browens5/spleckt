import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { portfolioProfile, portfolioProjects } from "@/lib/db/schema";
import { DEFAULT_PROFILE, DEFAULT_PROJECTS } from "./defaults";

export async function bootstrapPortfolio() {
  const existing = await db
    .select({ id: portfolioProfile.id })
    .from(portfolioProfile)
    .where(eq(portfolioProfile.id, DEFAULT_PROFILE.id))
    .limit(1);

  if (existing.length > 0) return;

  const now = new Date();
  await db.insert(portfolioProfile).values({
    id: DEFAULT_PROFILE.id,
    name: DEFAULT_PROFILE.name,
    tagline: DEFAULT_PROFILE.tagline,
    about: DEFAULT_PROFILE.about,
    skillsJson: JSON.stringify(DEFAULT_PROFILE.skills),
    contactEmail: DEFAULT_PROFILE.contactEmail,
    contactNote: DEFAULT_PROFILE.contactNote,
    updatedAt: now,
  });

  const projectCount = await db.select({ id: portfolioProjects.id }).from(portfolioProjects);
  if (projectCount.length > 0) return;

  await db.insert(portfolioProjects).values(
    DEFAULT_PROJECTS.map((project) => ({
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
    })),
  );
}
