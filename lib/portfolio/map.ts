import { publicAssetUrl } from "@/lib/storage";
import type { PortfolioProfile, PortfolioProject } from "./types";

type ProjectRow = {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  imageKey: string | null;
  imageName: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date | string | number | null;
  updatedAt: Date | string | number | null;
};

type ProfileRow = {
  id: string;
  name: string;
  tagline: string;
  about: string;
  skillsJson: string;
  contactEmail: string;
  contactNote: string;
  updatedAt: Date | string | number | null;
};

export function parseSkills(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to delimiter split
    }
  }
  return trimmed
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapProject(row: ProjectRow): PortfolioProject {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    year: row.year,
    description: row.description,
    imageKey: row.imageKey,
    imageName: row.imageName,
    imageUrl: row.imageKey ? publicAssetUrl(row.imageKey) : null,
    linkUrl: row.linkUrl,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapProfile(row: ProfileRow): PortfolioProfile {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    about: row.about,
    skills: parseSkills(row.skillsJson),
    contactEmail: row.contactEmail,
    contactNote: row.contactNote,
    updatedAt: row.updatedAt,
  };
}
