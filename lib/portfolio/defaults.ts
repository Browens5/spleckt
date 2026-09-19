import type { PortfolioProfile, PortfolioProject } from "./types";

export const DEFAULT_PROFILE_ID = "default";

export const LEGACY_PROJECT_IDS = [
  "pp_echoes",
  "pp_horizon",
  "pp_synapse",
  "pp_neon",
  "pp_abyss",
] as const;

export const DEFAULT_PROFILE: Omit<PortfolioProfile, "updatedAt"> = {
  id: DEFAULT_PROFILE_ID,
  name: "Brian Owens",
  tagline: "VDC & Field Solutions Engineer — AI, autonomy, and 3D capture for the jobsite.",
  about:
    "Solution-oriented engineer based in Des Moines, Iowa. I connect AI, autonomous systems, robotics, and advanced field technology to how work actually gets done — from FPV drone platforms to scaling capture programs across multi-billion-dollar data center projects. Photos, videos, and deeper write-ups will land on these cards next.",
  skills: [
    "Gaussian Splatting",
    "Photogrammetry",
    "3D Scanning & Modeling",
    "Part 107 UAS Pilot",
    "Autonomous Drone Docks",
    "DroneDeploy",
    "Python",
    "C++",
    "SolidWorks CSWP",
    "Onshape",
    "Fusion 360",
    "3D Printing / Prototyping",
  ],
  contactEmail: "browens515@gmail.com",
  contactNote:
    "Des Moines, IA · 208.380.6882. I am glad to talk drones, Gaussian splats, field tech, and how to get data from the site to the office.",
};

export const DEFAULT_LINKEDIN_URL = "https://www.linkedin.com/in/brianowens-engineer";

export const DEFAULT_PROJECTS: Array<
  Omit<PortfolioProject, "imageUrl" | "createdAt" | "updatedAt">
> = [
  {
    id: "pp_field",
    title: "Field Solutions",
    category: "Construction Tech",
    year: "2024",
    description:
      "Founded and lead Field Solutions at Weitz / Orascom Construction USA, putting cutting-edge tech in the hands of crews on multi-billion-dollar data center jobs.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: "pp_fleet",
    title: "Enterprise Fleet",
    category: "UAS Program",
    year: "2025",
    description:
      "Run an 80+ drone, 50-pilot enterprise program that keeps multi-site capture consistent and in the hands of project teams.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: "pp_docks",
    title: "Autonomous Docks",
    category: "BVLOS",
    year: "2025",
    description:
      "Secured an FAA nationwide BVLOS waiver and deployed five autonomous drone docks for daily site collection and analysis.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: "pp_splats",
    title: "Splat Pipelines",
    category: "3D Capture",
    year: "2025",
    description:
      "Built 3D Gaussian Splatting pipelines that make contractor-client communication clearer on live construction sites.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 4,
    isPublished: true,
  },
  {
    id: "pp_rising",
    title: "Rising Star",
    category: "Award",
    year: "2025",
    description:
      "DroneDeploy Rising Star 2025 for boosting field-to-office coordination with DroneDeploy Ground.",
    imageKey: null,
    imageName: null,
    linkUrl: null,
    sortOrder: 5,
    isPublished: true,
  },
];
