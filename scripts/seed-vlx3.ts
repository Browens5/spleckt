import "dotenv/config";
import { createClient } from "@libsql/client";
import {
  vlx3Lesson,
  vlx3ModuleMeta,
  vlx3TestQuestions,
} from "../lib/handoff/content/vlx3";

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:.data/spleckt.db";
const authToken =
  process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

const client = createClient({ url, authToken });
const now = Date.now();

const bootstrap = [
  `CREATE TABLE IF NOT EXISTS training_modules (
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
  )`,
  `CREATE TABLE IF NOT EXISTS training_tests (
    id TEXT PRIMARY KEY NOT NULL,
    module_id TEXT NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 80,
    questions_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
];

async function main() {
  for (const sql of bootstrap) {
    await client.execute(sql);
  }

  const body = JSON.stringify(vlx3Lesson);
  const testId = "tt_navvis_vlx3_ivion";

  await client.execute({
    sql: `INSERT INTO training_modules (
      id, slug, title, summary, body, kind, duration_minutes, sort_order, is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      body = excluded.body,
      kind = excluded.kind,
      duration_minutes = excluded.duration_minutes,
      sort_order = excluded.sort_order,
      is_published = 1,
      updated_at = excluded.updated_at`,
    args: [
      vlx3ModuleMeta.id,
      vlx3ModuleMeta.slug,
      vlx3ModuleMeta.title,
      vlx3ModuleMeta.summary,
      body,
      vlx3ModuleMeta.kind,
      vlx3ModuleMeta.durationMinutes,
      vlx3ModuleMeta.sortOrder,
      now,
      now,
    ],
  });

  const existing = await client.execute({
    sql: `SELECT id FROM training_tests WHERE module_id = ? LIMIT 1`,
    args: [vlx3ModuleMeta.id],
  });

  if (existing.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO training_tests (
        id, module_id, title, passing_score, questions_json, created_at, updated_at
      ) VALUES (?, ?, ?, 80, ?, ?, ?)`,
      args: [
        testId,
        vlx3ModuleMeta.id,
        `${vlx3ModuleMeta.title} certification test`,
        JSON.stringify(vlx3TestQuestions),
        now,
        now,
      ],
    });
  } else {
    await client.execute({
      sql: `UPDATE training_tests
            SET title = ?, passing_score = 80, questions_json = ?, updated_at = ?
            WHERE id = ?`,
      args: [
        `${vlx3ModuleMeta.title} certification test`,
        JSON.stringify(vlx3TestQuestions),
        now,
        existing.rows[0].id,
      ],
    });
  }

  console.log(
    `Seeded NavVis VLX 3 training: /center/modules/${vlx3ModuleMeta.slug}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
