import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { getDatabaseAuthToken, getDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __splecktDb?: Database;
  __splecktClient?: Client;
};

export function getDbClient() {
  if (!globalForDb.__splecktClient) {
    const url = getDatabaseUrl();
    const authToken = getDatabaseAuthToken();

    if (!url) {
      throw new Error("Missing TURSO_DATABASE_URL (or DATABASE_URL)");
    }

    // Remote Turso URLs require an auth token.
    if (
      (url.startsWith("libsql://") || url.startsWith("https://")) &&
      !authToken
    ) {
      throw new Error("Missing TURSO_AUTH_TOKEN (or DATABASE_AUTH_TOKEN)");
    }

    globalForDb.__splecktClient = createClient({
      url,
      authToken,
    });
  }

  return globalForDb.__splecktClient;
}

export function getDb() {
  if (!globalForDb.__splecktDb) {
    globalForDb.__splecktDb = drizzle(getDbClient(), { schema });
  }
  return globalForDb.__splecktDb;
}

/** Convenience alias used across the app. */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, property, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
  has(_target, property) {
    return property in (getDb() as object);
  },
  ownKeys() {
    return Reflect.ownKeys(getDb() as object);
  },
  getOwnPropertyDescriptor(_target, property) {
    return Object.getOwnPropertyDescriptor(getDb() as object, property);
  },
});
