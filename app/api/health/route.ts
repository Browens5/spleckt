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
import { getR2Status } from "@/lib/storage";

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

  const r2 = await getR2Status();

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
      urlHost: url
        .replace(/^libsql:\/\//, "")
        .replace(/^https?:\/\//, "")
        .split("/")[0],
    },
    r2: {
      ...r2,
      hint: !r2.configured
        ? "R2 env vars missing — uploads fall back to local (not suitable on Vercel)."
        : r2.corsOk
          ? "R2 CORS looks configured for browser uploads."
          : "Could not set R2 CORS automatically. In Cloudflare R2 → bucket → Settings → CORS, allow PUT from https://www.spleckt.com and https://portfolio.spleckt.com.",
    },
    authSecretConfigured: Boolean(process.env.BETTER_AUTH_SECRET),
  });
}
