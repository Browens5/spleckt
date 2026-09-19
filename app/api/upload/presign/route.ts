export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createId } from "@/lib/ids";
import {
  canEditSplats,
  canManageMarketing,
  canManagePortfolio,
  getSession,
  isAdmin,
} from "@/lib/session";
import { createUploadUrl } from "@/lib/storage";

const bodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  purpose: z.enum(["splat", "thumbnail", "media", "media-poster", "portfolio"]),
  ownerId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { fileName, contentType, purpose, ownerId } = parsed.data;
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (
    (purpose === "splat" || purpose === "thumbnail") &&
    !canEditSplats(session.user.role)
  ) {
    return NextResponse.json(
      { error: "Viewers cannot upload files." },
      { status: 403 },
    );
  }

  const targetOwner =
    isAdmin(session.user.role) && ownerId ? ownerId : session.user.id;

  let key: string;
  switch (purpose) {
    case "splat":
      key = `splats/${targetOwner}/${createId()}-${safeName}`;
      break;
    case "thumbnail":
      key = `thumbnails/${targetOwner}/${createId()}-${safeName}`;
      break;
    case "media":
      if (!canManageMarketing(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      key = `media/${createId()}-${safeName}`;
      break;
    case "media-poster":
      if (!canManageMarketing(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      key = `media/posters/${createId()}-${safeName}`;
      break;
    case "portfolio":
      if (!canManagePortfolio(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      key = `portfolio/${createId()}-${safeName}`;
      break;
  }

  const upload = await createUploadUrl({ key, contentType });
  return NextResponse.json({ key, ...upload });
}
