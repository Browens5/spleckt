export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { getDbClient } from "@/lib/db";
import {
  getAppUrl,
  getDatabaseAuthToken,
  getDatabaseUrl,
  getTrustedOrigins,
} from "@/lib/env";

export async function GET() {
  const url = getDatabaseUrl();
  const hasToken = Boolean(getDatabaseAuthToken());
  const isRemote = url.startsWith("libsql://") || url.startsWith("https://");

  let dbOk = false;
  let dbError: string | null = null;
  let tableCount: number | null = null;

  try {
    await ensureSchema();
    const result = await getDbClient().execute(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'",
    );
    tableCount = Number(result.rows[0]?.count ?? 0);
    dbOk = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Unknown database error";
  }

  return NextResponse.json({
    ok: dbOk,
    appUrl: getAppUrl(),
    trustedOrigins: getTrustedOrigins(),
    database: {
      configured: Boolean(url),
      remote: isRemote,
      hasAuthToken: hasToken,
      ok: dbOk,
      tableCount,
      error: dbError,
      // Never return the full URL with credentials; only host-ish hint.
      urlHost: url.replace(/^libsql:\/\//, "").replace(/^https?:\/\//, "").split("/")[0],
    },
    authSecretConfigured: Boolean(process.env.BETTER_AUTH_SECRET),
  });
}
