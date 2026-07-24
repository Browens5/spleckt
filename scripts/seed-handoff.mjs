import "dotenv/config";
import { createClient } from "@libsql/client";

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:.data/spleckt.db";
const authToken =
  process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

const client = createClient({ url, authToken });

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

for (const sql of bootstrap) {
  await client.execute(sql);
}

const now = Date.now();

const modules = [
  {
    id: "tm_site_walkthrough",
    slug: "site-walkthrough-basics",
    title: "Site Walkthrough Basics",
    summary:
      "Plan and run a structured walkthrough so nothing important is missed during a handoff.",
    kind: "technique",
    duration: 20,
    sort: 1,
    body: [
      "## Why walkthroughs matter",
      "A clean handoff starts with a shared view of the space. This module covers how to prepare, capture notes, and confirm readiness with the receiving team.",
      "",
      "## Before you start",
      "- Confirm access windows and safety requirements.",
      "- Bring a checklist keyed to rooms, systems, and exceptions.",
      "- Decide who owns each follow-up before you leave the site.",
      "",
      "## During the walkthrough",
      "Move room by room. Call out what is complete, what is pending, and what is intentionally out of scope. Photograph or mark exceptions so they survive the meeting.",
      "",
      "## Closing the loop",
      "End with a short readout: open items, owners, and due dates. A walkthrough without owners is just a tour.",
    ].join("\n"),
    questions: [
      {
        id: "q1",
        prompt: "What should you confirm before a site walkthrough?",
        choices: [
          "Only the weather forecast",
          "Access windows, safety requirements, and checklist ownership",
          "Social media posting schedule",
          "Paint brand preference only",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "How should exceptions be handled during the walkthrough?",
        choices: [
          "Ignore them if time is short",
          "Mention them once verbally and move on",
          "Photograph or mark them so they survive the meeting",
          "Leave them for the next quarter review",
        ],
        correctIndex: 2,
      },
      {
        id: "q3",
        prompt: "What belongs in the closing readout?",
        choices: [
          "Open items, owners, and due dates",
          "Only compliments about the space",
          "A list of unrelated tools",
          "Nothing — the walkthrough itself is enough",
        ],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "tm_checklist_tool",
    slug: "digital-checklist-tool",
    title: "Digital Checklist Tool",
    summary:
      "Use the shared checklist tool to track training tasks, blockers, and sign-off.",
    kind: "tool",
    duration: 15,
    sort: 2,
    body: [
      "## Tool purpose",
      "The digital checklist keeps handoff tasks visible across teams. Every item has a status, an owner, and optional evidence.",
      "",
      "## Working the board",
      "- Create items from the module template, not from memory.",
      "- Move items to In review only when evidence is attached.",
      "- Use blockers for anything that depends on another team.",
      "",
      "## Sign-off",
      "A module is ready for certification only when required checklist items are complete or explicitly waived with a note.",
    ].join("\n"),
    questions: [
      {
        id: "q1",
        prompt: "When should an item move to In review?",
        choices: [
          "As soon as it is assigned",
          "Only after evidence is attached",
          "When the week ends",
          "After certification is issued",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "What are blockers for?",
        choices: [
          "Decorative labels",
          "Tasks that depend on another team",
          "Completed work",
          "Renaming modules",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        prompt: "When is a module ready for certification?",
        choices: [
          "Whenever someone feels confident",
          "After required checklist items are complete or explicitly waived",
          "After creating one checklist item",
          "Only on Fridays",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "tm_docs_software",
    slug: "handoff-docs-workspace",
    title: "Handoff Docs Workspace",
    summary:
      "Organize living documentation so the next person can ramp without tribal knowledge.",
    kind: "software",
    duration: 25,
    sort: 3,
    body: [
      "## Workspace layout",
      "Keep one home document per engagement. Link out to procedures, media, and decision logs instead of burying details in chat.",
      "",
      "## Writing for the next owner",
      "- Lead with outcomes, then steps.",
      "- Call out non-obvious constraints.",
      "- Date every decision and name who approved it.",
      "",
      "## Version discipline",
      "Treat the workspace as the source of truth. If a detail changes in a meeting, update the doc the same day.",
    ].join("\n"),
    questions: [
      {
        id: "q1",
        prompt: "Where should engagement details live?",
        choices: [
          "Scattered across private chats",
          "In one home document with linked procedures",
          "Only in email subject lines",
          "On sticky notes",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "What should documentation call out clearly?",
        choices: [
          "Only marketing slogans",
          "Non-obvious constraints and dated decisions",
          "Unrelated hobbies",
          "Nothing beyond a title",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        prompt: "When should the workspace be updated after a meeting change?",
        choices: [
          "The same day",
          "Whenever convenient next month",
          "Never — chat is enough",
          "Only after certification expires",
        ],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "tm_knowledge_transfer",
    slug: "knowledge-transfer-session",
    title: "Knowledge Transfer Session",
    summary:
      "Run a focused knowledge transfer that turns expertise into repeatable practice.",
    kind: "module",
    duration: 30,
    sort: 4,
    body: [
      "## Session goals",
      "A knowledge transfer is successful when the receiving person can complete the critical path without the original owner in the room.",
      "",
      "## Structure",
      "1. Context and success criteria (5 minutes)",
      "2. Live demonstration of the critical path",
      "3. Guided practice with feedback",
      "4. Open questions and written follow-ups",
      "",
      "## Aftercare",
      "Send a short summary with links, remaining risks, and the certification test deadline.",
    ].join("\n"),
    questions: [
      {
        id: "q1",
        prompt: "When is a knowledge transfer successful?",
        choices: [
          "When slides were presented",
          "When the receiving person can complete the critical path independently",
          "When everyone attended",
          "When the meeting ended on time",
        ],
        correctIndex: 1,
      },
      {
        id: "q2",
        prompt: "Which step belongs in the session structure?",
        choices: [
          "Guided practice with feedback",
          "Skipping demonstration to save time",
          "Deleting documentation afterward",
          "Avoiding questions",
        ],
        correctIndex: 0,
      },
      {
        id: "q3",
        prompt: "What should follow the session?",
        choices: [
          "Nothing",
          "A summary with links, risks, and the certification test deadline",
          "A new unrelated project kickoff",
          "Deleting the checklist",
        ],
        correctIndex: 1,
      },
    ],
  },
];

for (const mod of modules) {
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
      mod.id,
      mod.slug,
      mod.title,
      mod.summary,
      mod.body,
      mod.kind,
      mod.duration,
      mod.sort,
      now,
      now,
    ],
  });

  const testId = `tt_${mod.id.replace(/^tm_/, "")}`;
  const existing = await client.execute({
    sql: `SELECT id FROM training_tests WHERE module_id = ? LIMIT 1`,
    args: [mod.id],
  });

  if (existing.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO training_tests (
        id, module_id, title, passing_score, questions_json, created_at, updated_at
      ) VALUES (?, ?, ?, 80, ?, ?, ?)`,
      args: [
        testId,
        mod.id,
        `${mod.title} certification test`,
        JSON.stringify(mod.questions),
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
        `${mod.title} certification test`,
        JSON.stringify(mod.questions),
        now,
        existing.rows[0].id,
      ],
    });
  }
}

console.log(`Seeded ${modules.length} Handoff training modules.`);
