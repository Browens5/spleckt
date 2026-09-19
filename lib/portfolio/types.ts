export type PortfolioProject = {
  id: string;
  title: string;
  category: string;
  year: string;
  description: string;
  imageUrl: string | null;
  imageKey: string | null;
  imageName: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date | string | number | null;
  updatedAt: Date | string | number | null;
};

export type PortfolioProfile = {
  id: string;
  name: string;
  tagline: string;
  about: string;
  skills: string[];
  contactEmail: string;
  contactNote: string;
  updatedAt: Date | string | number | null;
};

export type PortfolioSection = "about" | "portfolio" | "skills" | "contact";
