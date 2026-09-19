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
  "Gaussian Splats",
  "PlayCanvas",
  "Cinematic Lighting",
  "Photogrammetry",
  "Drone Capture",
  "Interactive 3D",
  "Visual Design",
  "Real-time Worlds",
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
    "Spleckt",
    "Lifelike 3D captures, cinematic worlds, and interactive experiences.",
    "Spleckt builds hyperrealistic 3D Gaussian Splat captures and interactive worlds for real estate, construction, and cinematic storytelling. This portfolio is a living reel — swap the cards, drop in stills, and write the story behind each project.",
    skills,
    "hello@spleckt.com",
    "Tell us about a site, a story, or a world you want people to walk through. We will reply with a capture plan.",
    now,
  ],
});

const projects = [
  [
    "pp_echoes",
    "Echoes of Tomorrow",
    "Cinematic",
    "2024",
    "A cinematic exploration of future cities where technology and humanity converge.",
    1,
  ],
  [
    "pp_horizon",
    "Beyond Horizon",
    "Visual Design",
    "2024",
    "Exploring the unknown reaches of space and time.",
    2,
  ],
  [
    "pp_synapse",
    "Synapse",
    "Motion Graphics",
    "2023",
    "Neural connections in constant motion.",
    3,
  ],
  [
    "pp_neon",
    "Neon Drive",
    "3D Animation",
    "2024",
    "High speed through a neon dreamscape.",
    4,
  ],
  [
    "pp_abyss",
    "Abyss",
    "Digital Art",
    "2023",
    "An abstract dive into the depths of the unknown.",
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
      updated_at = excluded.updated_at`,
    args: [id, title, category, year, description, sort, now, now],
  });
}

console.log("Portfolio profile and demo cards are ready.");
console.log("Open http://portfolio.localhost:3000 and sign in as an editor to replace them.");
