import { writeFileSync } from "node:fs";
import {
  vlx3Lesson,
  vlx3ModuleMeta,
  vlx3TestQuestions,
} from "../lib/handoff/content/vlx3";

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

const now = Date.now();
const body = JSON.stringify(vlx3Lesson);
const questions = JSON.stringify(vlx3TestQuestions);

const createTables = `-- Step 0 (optional): create tables if they do not exist yet
CREATE TABLE IF NOT EXISTS training_modules (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'module',
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
  id, slug, title, summary, body, kind, duration_minutes, sort_order, is_published, created_at, updated_at
) VALUES (
  ${sqlString(vlx3ModuleMeta.id)},
  ${sqlString(vlx3ModuleMeta.slug)},
  ${sqlString(vlx3ModuleMeta.title)},
  ${sqlString(vlx3ModuleMeta.summary)},
  ${sqlString(body)},
  ${sqlString(vlx3ModuleMeta.kind)},
  ${vlx3ModuleMeta.durationMinutes},
  ${vlx3ModuleMeta.sortOrder},
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
  ${sqlString("tt_navvis_vlx3_ivion")},
  ${sqlString(vlx3ModuleMeta.id)},
  ${sqlString(`${vlx3ModuleMeta.title} certification test`)},
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
SELECT id, slug, title FROM training_modules WHERE slug = 'navvis-vlx3-ivion';
SELECT id, module_id, title, passing_score FROM training_tests WHERE id = 'tt_navvis_vlx3_ivion';
`;

const combined = `-- NavVis VLX 3 + IVION seed for Turso SQL Editor
-- IMPORTANT: Run Step 1, then Step 2 separately (do not rely on DELETE).

${createTables}

${insertModule}

${insertTest}

${verify}
`;

writeFileSync("scripts/seed-vlx3-turso.sql", combined);
writeFileSync("scripts/seed-vlx3-turso-step1-module.sql", insertModule);
writeFileSync("scripts/seed-vlx3-turso-step2-test.sql", insertTest);
console.log("Wrote Turso SQL seed files for VLX 3 (upsert-safe, no DELETE)");
