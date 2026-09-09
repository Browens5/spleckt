import { NextResponse } from "next/server";
import { resolveYoutubeDownload } from "@/lib/cubemap/youtube-innertube";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Resolve a YouTube URL to download metadata using youtubei.js only
 * (no yt-dlp / ffmpeg). The client then streams bytes via /api/cubemap/youtube/proxy
 * into a local folder.
 */
export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  try {
    const resolved = await resolveYoutubeDownload(String(body.url ?? ""));
    return NextResponse.json({
      ok: true,
      videoId: resolved.videoId,
      title: resolved.title,
      durationSec: resolved.durationSec,
      projection: resolved.projection,
      fileName: resolved.fileName,
      mimeType: resolved.mimeType,
      width: resolved.width,
      height: resolved.height,
      qualityLabel: resolved.qualityLabel,
      // Client must fetch this through our proxy (CORS + URL expiry).
      proxyPath: `/api/cubemap/youtube/proxy?url=${encodeURIComponent(resolved.streamUrl)}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not resolve YouTube media.";
    const status = /sign-in|bot check|cookies/i.test(message)
      ? 403
      : /valid URL|youtube\.com|video id|Paste a YouTube/i.test(message)
        ? 400
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
