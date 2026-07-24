import "dotenv/config";
import { createClient } from "@libsql/client";
import {
  mavic3eLesson,
  mavic3eModuleMeta,
  mavic3eTestQuestions,
} from "../lib/handoff/content/mavic3e";

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
    category TEXT NOT NULL DEFAULT 'general',
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

  try {
    await client.execute(
      `ALTER TABLE training_modules ADD COLUMN category TEXT NOT NULL DEFAULT 'general'`,
    );
  } catch {
    // Column already exists.
  }

  const body = JSON.stringify(mavic3eLesson);
  const testId = "tt_dji_mavic_3_enterprise";

  await client.execute({
    sql: `INSERT INTO training_modules (
      id, slug, title, summary, body, kind, category, duration_minutes, sort_order, is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      body = excluded.body,
      kind = excluded.kind,
      category = excluded.category,
      duration_minutes = excluded.duration_minutes,
      sort_order = excluded.sort_order,
      is_published = 1,
      updated_at = excluded.updated_at`,
    args: [
      mavic3eModuleMeta.id,
      mavic3eModuleMeta.slug,
      mavic3eModuleMeta.title,
      mavic3eModuleMeta.summary,
      body,
      mavic3eModuleMeta.kind,
      mavic3eModuleMeta.category,
      mavic3eModuleMeta.durationMinutes,
      mavic3eModuleMeta.sortOrder,
      now,
      now,
    ],
  });

  const existing = await client.execute({
    sql: `SELECT id FROM training_tests WHERE module_id = ? LIMIT 1`,
    args: [mavic3eModuleMeta.id],
  });

  if (existing.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO training_tests (
        id, module_id, title, passing_score, questions_json, created_at, updated_at
      ) VALUES (?, ?, ?, 80, ?, ?, ?)`,
      args: [
        testId,
        mavic3eModuleMeta.id,
        `${mavic3eModuleMeta.title} certification test`,
        JSON.stringify(mavic3eTestQuestions),
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
        `${mavic3eModuleMeta.title} certification test`,
        JSON.stringify(mavic3eTestQuestions),
        now,
        existing.rows[0].id,
      ],
    });
  }

  console.log(
    `Seeded Mavic 3 Enterprise training: /center/modules/${mavic3eModuleMeta.slug}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
