import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { getDatabaseAuthToken, getDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

type Database = LibSQLDatabase<typeof schema>;

let client: Client | null = null;
let database: Database | null = null;

function getClient() {
  if (!client) {
    client = createClient({
      url: getDatabaseUrl(),
      authToken: getDatabaseAuthToken(),
    });
  }
  return client;
}

function getDb() {
  if (!database) {
    database = drizzle(getClient(), { schema });
  }
  return database;
}

/** Lazily-initialized DB proxy so Next build does not open SQLite at import time. */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const value = Reflect.get(getDb(), property, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
