import "dotenv/config";
import { createClient } from "@libsql/client";

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:.data/spleckt.db";
const authToken =
  process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

const client = createClient({ url, authToken });
const now = Date.now();

await client.execute(`
  CREATE TABLE IF NOT EXISTS portfolio_projects (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image_key TEXT,
    image_name TEXT,
    content_type TEXT,
    link_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS portfolio_profile (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL DEFAULT 'Portfolio',
    tagline TEXT NOT NULL DEFAULT '',
    about TEXT NOT NULL DEFAULT '',
    skills_json TEXT NOT NULL DEFAULT '[]',
    contact_email TEXT NOT NULL DEFAULT '',
    contact_note TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL
  )
`);

const skills = JSON.stringify([
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
]);

await client.execute({
  sql: `INSERT INTO portfolio_profile (
    id, name, tagline, about, skills_json, contact_email, contact_note, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    tagline = excluded.tagline,
    about = excluded.about,
    skills_json = excluded.skills_json,
    contact_email = excluded.contact_email,
    contact_note = excluded.contact_note,
    updated_at = excluded.updated_at`,
  args: [
    "default",
    "Brian Owens",
    "VDC & Field Solutions Engineer — AI, autonomy, and 3D capture for the jobsite.",
    "Solution-oriented engineer based in Des Moines, Iowa. I connect AI, autonomous systems, robotics, and advanced field technology to how work actually gets done — from FPV drone platforms to scaling capture programs across multi-billion-dollar data center projects. Photos, videos, and deeper write-ups will land on these cards next.",
    skills,
    "browens515@gmail.com",
    "Des Moines, IA · 208.380.6882 · LinkedIn. I am glad to talk drones, Gaussian splats, field tech, and how to get data from the site to the office.",
    now,
  ],
});

await client.execute(
  `DELETE FROM portfolio_projects WHERE id IN (
    'pp_echoes','pp_horizon','pp_synapse','pp_neon','pp_abyss'
  )`,
);

const projects = [
  [
    "pp_field",
    "Field Solutions",
    "Construction Tech",
    "2024",
    "Founded and lead Field Solutions at Weitz / Orascom Construction USA, putting cutting-edge tech in the hands of crews on multi-billion-dollar data center jobs.",
    1,
  ],
  [
    "pp_fleet",
    "Enterprise Fleet",
    "UAS Program",
    "2025",
    "Run an 80+ drone, 50-pilot enterprise program that keeps multi-site capture consistent and in the hands of project teams.",
    2,
  ],
  [
    "pp_docks",
    "Autonomous Docks",
    "BVLOS",
    "2025",
    "Secured an FAA nationwide BVLOS waiver and deployed five autonomous drone docks for daily site collection and analysis.",
    3,
  ],
  [
    "pp_splats",
    "Splat Pipelines",
    "3D Capture",
    "2025",
    "Built 3D Gaussian Splatting pipelines that make contractor-client communication clearer on live construction sites.",
    4,
  ],
  [
    "pp_rising",
    "Rising Star",
    "Award",
    "2025",
    "DroneDeploy Rising Star 2025 for boosting field-to-office coordination with DroneDeploy Ground.",
    5,
  ],
];

for (const [id, title, category, year, description, sort] of projects) {
  await client.execute({
    sql: `INSERT INTO portfolio_projects (
      id, title, category, year, description, sort_order, is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      category = excluded.category,
      year = excluded.year,
      description = excluded.description,
      sort_order = excluded.sort_order,
      is_published = 1,
      updated_at = excluded.updated_at`,
    args: [id, title, category, year, description, sort, now, now],
  });
}

console.log("Brian Owens portfolio profile and starter cards are ready.");
console.log("Open http://portfolio.localhost:3000 — add photos later from the editor.");
