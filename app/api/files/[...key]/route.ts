export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getLocalObject, isR2Configured } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ply: "application/octet-stream",
  sog: "application/octet-stream",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string[] }> },
) {
  if (isR2Configured() && process.env.R2_PUBLIC_URL) {
    return NextResponse.json(
      { error: "Use the public R2 URL for this asset." },
      { status: 404 },
    );
  }

  const { key } = await context.params;
  const objectKey = key.join("/");

  try {
    const data = await getLocalObject(objectKey);
    const ext = objectKey.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
