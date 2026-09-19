import type { PortfolioProfile, PortfolioProject } from "./types";

export const DEFAULT_PROFILE_ID = "default";

export const DEFAULT_PROFILE: Omit<PortfolioProfile, "updatedAt"> = {
  id: DEFAULT_PROFILE_ID,
  name: "Spleckt",
  tagline: "Lifelike 3D captures, cinematic worlds, and interactive experiences.",
  about:
    "Spleckt builds hyperrealistic 3D Gaussian Splat captures and interactive worlds for real estate, construction, and cinematic storytelling. This portfolio is a living reel — swap the cards, drop in stills, and write the story behind each project.",
  skills: [
    "Gaussian Splats",
    "PlayCanvas",
    "Cinematic Lighting",
    "Photogrammetry",
    "Drone Capture",
    "Interactive 3D",
    "Visual Design",
    "Real-time Worlds",
  ],
  contactEmail: "hello@spleckt.com",
  contactNote:
    "Tell us about a site, a story, or a world you want people to walk through. We will reply with a capture plan.",
};

export const DEFAULT_PROJECTS: Array<
  Omit<PortfolioProject, "imageUrl" | "createdAt" | "updatedAt">
> = [
  {
    id: "pp_echoes",
    title: "Echoes of Tomorrow",
    category: "Cinematic",
    year: "2024",
    description:
      "A cinematic exploration of future cities where technology and humanity converge.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: "pp_horizon",
    title: "Beyond Horizon",
    category: "Visual Design",
    year: "2024",
    description: "Exploring the unknown reaches of space and time.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: "pp_synapse",
    title: "Synapse",
    category: "Motion Graphics",
    year: "2023",
    description: "Neural connections in constant motion.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: "pp_neon",
    title: "Neon Drive",
    category: "3D Animation",
    year: "2024",
    description: "High speed through a neon dreamscape.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 4,
    isPublished: true,
  },
  {
    id: "pp_abyss",
    title: "Abyss",
    category: "Digital Art",
    year: "2023",
    description: "An abstract dive into the depths of the unknown.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 5,
    isPublished: true,
  },
];
