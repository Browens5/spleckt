export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { canEditSplats, canManageMarketing, getSession, isAdmin } from "@/lib/session";
import { putLocalObject } from "@/lib/storage";

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
  const isOwnSplatPrefix =
    key.startsWith(`splats/${session.user.id}/`) ||
    key.startsWith(`thumbnails/${session.user.id}/`);

  if (isMedia && !canManageMarketing(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isMedia && !canEditSplats(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isMedia && !isAdmin(role) && !isOwnSplatPrefix) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType =
    request.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await request.arrayBuffer());
  const publicUrl = await putLocalObject(key, buffer, contentType);

  return NextResponse.json({ ok: true, publicUrl });
}
