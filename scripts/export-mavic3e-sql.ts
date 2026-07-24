import { writeFileSync } from "node:fs";
import {
  mavic3eLesson,
  mavic3eModuleMeta,
  mavic3eTestQuestions,
} from "../lib/handoff/content/mavic3e";

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

const now = Date.now();
const body = JSON.stringify(mavic3eLesson);
const questions = JSON.stringify(mavic3eTestQuestions);

const createTables = `-- Step 0 (optional): create tables if they do not exist yet
CREATE TABLE IF NOT EXISTS training_modules (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'module',
  category TEXT NOT NULL DEFAULT 'general',
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS training_tests (
  id TEXT PRIMARY KEY NOT NULL,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 80,
  questions_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

const insertModule = `-- Step 1: run this by itself first
INSERT INTO training_modules (
  id, slug, title, summary, body, kind, category, duration_minutes, sort_order, is_published, created_at, updated_at
) VALUES (
  ${sqlString(mavic3eModuleMeta.id)},
  ${sqlString(mavic3eModuleMeta.slug)},
  ${sqlString(mavic3eModuleMeta.title)},
  ${sqlString(mavic3eModuleMeta.summary)},
  ${sqlString(body)},
  ${sqlString(mavic3eModuleMeta.kind)},
  ${sqlString(mavic3eModuleMeta.category)},
  ${mavic3eModuleMeta.durationMinutes},
  ${mavic3eModuleMeta.sortOrder},
  1,
  ${now},
  ${now}
)
ON CONFLICT(slug) DO UPDATE SET
  id = excluded.id,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  kind = excluded.kind,
  category = excluded.category,
  duration_minutes = excluded.duration_minutes,
  sort_order = excluded.sort_order,
  is_published = 1,
  updated_at = excluded.updated_at;
`;

const insertTest = `-- Step 2: run only after Step 1 succeeds
-- Uses UPSERT (no DELETE) so foreign keys on attempts/certs are not violated
INSERT INTO training_tests (
  id, module_id, title, passing_score, questions_json, created_at, updated_at
) VALUES (
  ${sqlString("tt_dji_mavic_3_enterprise")},
  ${sqlString(mavic3eModuleMeta.id)},
  ${sqlString(`${mavic3eModuleMeta.title} certification test`)},
  80,
  ${sqlString(questions)},
  ${now},
  ${now}
)
ON CONFLICT(id) DO UPDATE SET
  module_id = excluded.module_id,
  title = excluded.title,
  passing_score = excluded.passing_score,
  questions_json = excluded.questions_json,
  updated_at = excluded.updated_at;
`;

const verify = `-- Step 3: verify
SELECT id, slug, title FROM training_modules WHERE slug = 'dji-mavic-3-enterprise';
SELECT id, module_id, title, passing_score FROM training_tests WHERE id = 'tt_dji_mavic_3_enterprise';
`;

const combined = `-- Mavic 3 Enterprise seed for Turso SQL Editor
-- IMPORTANT: Run Step 1, then Step 2 separately (do not rely on DELETE).

${createTables}

${insertModule}

${insertTest}

${verify}
`;

writeFileSync("scripts/seed-mavic3e-turso.sql", combined);
writeFileSync("scripts/seed-mavic3e-turso-step1-module.sql", insertModule);
writeFileSync("scripts/seed-mavic3e-turso-step2-test.sql", insertTest);
console.log("Wrote Turso SQL seed files for Mavic 3 Enterprise (upsert-safe, no DELETE)");
