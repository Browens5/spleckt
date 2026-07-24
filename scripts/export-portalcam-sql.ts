import { writeFileSync } from "node:fs";
import {
  portalCamLesson,
  portalCamModuleMeta,
  portalCamTestQuestions,
} from "../lib/handoff/content/portalcam";

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

const now = Date.now();
const body = JSON.stringify(portalCamLesson);
const questions = JSON.stringify(portalCamTestQuestions);

const sql = `-- Paste into Turso Dashboard → your production DB → SQL Editor
-- Seeds the XGRIDS PortalCam interactive training module + certification test

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
  module_id TEXT NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 80,
  questions_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO training_modules (
  id, slug, title, summary, body, kind, duration_minutes, sort_order, is_published, created_at, updated_at
) VALUES (
  ${sqlString(portalCamModuleMeta.id)},
  ${sqlString(portalCamModuleMeta.slug)},
  ${sqlString(portalCamModuleMeta.title)},
  ${sqlString(portalCamModuleMeta.summary)},
  ${sqlString(body)},
  ${sqlString(portalCamModuleMeta.kind)},
  ${portalCamModuleMeta.durationMinutes},
  ${portalCamModuleMeta.sortOrder},
  1,
  ${now},
  ${now}
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  kind = excluded.kind,
  duration_minutes = excluded.duration_minutes,
  sort_order = excluded.sort_order,
  is_published = 1,
  updated_at = excluded.updated_at;

DELETE FROM training_tests WHERE module_id = ${sqlString(portalCamModuleMeta.id)};

INSERT INTO training_tests (
  id, module_id, title, passing_score, questions_json, created_at, updated_at
) VALUES (
  ${sqlString("tt_portalcam_construction")},
  ${sqlString(portalCamModuleMeta.id)},
  ${sqlString(`${portalCamModuleMeta.title} certification test`)},
  80,
  ${sqlString(questions)},
  ${now},
  ${now}
);
`;

const out = process.argv[2] ?? "scripts/seed-portalcam-turso.sql";
writeFileSync(out, sql);
console.log(`Wrote ${out} (${sql.length} chars)`);
