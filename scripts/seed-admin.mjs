import "dotenv/config";
import { createClient } from "@libsql/client";
import { hashPassword } from "better-auth/crypto";

const url = process.env.DATABASE_URL ?? "file:.data/spleckt.db";
const email = process.env.ADMIN_EMAIL ?? "admin@spleckt.com";
const password = process.env.ADMIN_PASSWORD ?? "changeme123";
const name = process.env.ADMIN_NAME ?? "Spleckt Admin";

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const userId = crypto.randomUUID();
const accountId = crypto.randomUUID();
const hashed = await hashPassword(password);
const now = Date.now();

await client.execute({
  sql: `INSERT INTO user (id, name, email, email_verified, image, role, created_at, updated_at)
        VALUES (?, ?, ?, 1, NULL, 'admin', ?, ?)
        ON CONFLICT(email) DO UPDATE SET role = 'admin', name = excluded.name, updated_at = excluded.updated_at`,
  args: [userId, name, email, now, now],
});

const existing = await client.execute({
  sql: `SELECT id FROM user WHERE email = ? LIMIT 1`,
  args: [email],
});
const resolvedUserId = existing.rows[0]?.id ?? userId;

const account = await client.execute({
  sql: `SELECT id FROM account WHERE user_id = ? AND provider_id = 'credential' LIMIT 1`,
  args: [resolvedUserId],
});

if (account.rows.length === 0) {
  await client.execute({
    sql: `INSERT INTO account (
      id, account_id, provider_id, user_id, password, created_at, updated_at
    ) VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
    args: [accountId, resolvedUserId, resolvedUserId, hashed, now, now],
  });
} else {
  await client.execute({
    sql: `UPDATE account SET password = ?, updated_at = ? WHERE id = ?`,
    args: [hashed, now, account.rows[0].id],
  });
}

console.log(`Admin ready: ${email}`);
console.log("Sign in at /login and change the password after first login.");
