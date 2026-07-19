import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:.data/spleckt.db";

const authToken =
  process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

const isRemote = url.startsWith("libsql://") || url.startsWith("https://");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
});
