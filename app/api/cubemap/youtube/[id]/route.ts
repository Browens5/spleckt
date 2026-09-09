export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import {
  guessContentType,
  openYoutubeFileStream,
  readYoutubeJob,
} from "@/lib/cubemap/youtube";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  const job = await readYoutubeJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const kind = new URL(request.url).searchParams.get("kind") ?? "equirect";
  const filePath =
    kind === "source" ? job.sourcePath : job.equirectPath ?? job.sourcePath;
  if (!filePath) {
    return NextResponse.json({ error: "File not ready." }, { status: 404 });
  }

  const fileName =
    kind === "source"
      ? `${job.videoId}_source${filePath.slice(filePath.lastIndexOf("."))}`
      : `${job.videoId}_equirect.mp4`;

  return new NextResponse(openYoutubeFileStream(id, filePath), {
    headers: {
      "Content-Type": guessContentType(filePath),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
