export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  canEditSplats,
  canManageMarketing,
  canManagePortfolio,
  getSession,
  isAdmin,
} from "@/lib/session";
import { ensureR2Cors, isR2Configured, putObject } from "@/lib/storage";

/**
 * Same-origin upload proxy. Useful for smaller files / debugging.
 * Large splat files should still use R2 presigned URLs (browser → R2).
 */
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const role = session.user.role;
  const isMedia = key.startsWith("media/");
  const isPortfolio = key.startsWith("portfolio/");
  const isOwnSplatPrefix =
    key.startsWith(`splats/${session.user.id}/`) ||
    key.startsWith(`thumbnails/${session.user.id}/`);

  if (isMedia && !canManageMarketing(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isPortfolio && !canManagePortfolio(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isMedia && !isPortfolio && !canEditSplats(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isMedia && !isPortfolio && !isAdmin(role) && !isOwnSplatPrefix) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft size guard for the proxy path (Vercel body limits).
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > 4.2 * 1024 * 1024) {
    return NextResponse.json(
      {
        error:
          "File too large for proxy upload. Use R2 direct upload (configure bucket CORS).",
      },
      { status: 413 },
    );
  }

  if (isR2Configured()) {
    await ensureR2Cors();
  }

  const contentType =
    request.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await request.arrayBuffer());

  try {
    const publicUrl = await putObject(key, buffer, contentType);
    return NextResponse.json({ ok: true, publicUrl });
  } catch (error) {
    console.error("upload proxy failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Upload storage failed",
      },
      { status: 500 },
    );
  }
}
