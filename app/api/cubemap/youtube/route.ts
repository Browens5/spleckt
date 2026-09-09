export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  assertYoutubeTools,
  convertYoutubeToEquirect,
  downloadYoutubeVideo,
  parseYoutubeUrl,
} from "@/lib/cubemap/youtube";

type Body = {
  url?: string;
  startTimeSec?: number;
  endTimeSec?: number | null;
  forceEac?: boolean;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  try {
    const { videoId, canonicalUrl } = parseYoutubeUrl(String(body.url ?? ""));
    await assertYoutubeTools();

    const jobId = `${videoId}_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
    const downloaded = await downloadYoutubeVideo({
      url: canonicalUrl,
      videoId,
      jobId,
    });

    const prepared = await convertYoutubeToEquirect({
      job: downloaded,
      startTimeSec: typeof body.startTimeSec === "number" ? body.startTimeSec : 0,
      endTimeSec: body.endTimeSec ?? null,
      forceEac: body.forceEac === true || downloaded.projection !== "equirect",
    });

    const fileName = `${prepared.videoId}_equirect.mp4`;
    return NextResponse.json({
      ok: true,
      jobId: prepared.id,
      videoId: prepared.videoId,
      title: prepared.title,
      durationSec: prepared.durationSec,
      projection: prepared.projection,
      width: prepared.width,
      height: prepared.height,
      downloadPath: `/api/cubemap/youtube/${prepared.id}?kind=equirect`,
      fileName,
      note:
        prepared.projection === "eac"
          ? "Downloaded YouTube 360 EAC and converted to equirectangular for cubemap export."
          : "Downloaded YouTube video and prepared an equirectangular clip for cubemap export.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube import failed.";
    const status = /yt-dlp is not available|ffmpeg is required/i.test(message)
      ? 503
      : /sign-in|bot check|cookies/i.test(message)
        ? 403
        : /valid URL|youtube\.com|video id|Paste a YouTube/i.test(message)
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  try {
    await assertYoutubeTools();
    return NextResponse.json({
      ok: true,
      enabled: true,
      cookiesConfigured: Boolean(process.env.YOUTUBE_COOKIES_FILE),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      enabled: false,
      error: error instanceof Error ? error.message : "YouTube tools unavailable.",
    });
  }
}
