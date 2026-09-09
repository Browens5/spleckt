"use client";

/**
 * Client helpers for the YouTube “Save to folder & process” flow.
 * Resolution happens on the host via youtubei.js (npm only — no yt-dlp/ffmpeg);
 * the browser streams bytes through a same-origin proxy into a local folder.
 */

export type ResolvedYoutubeMedia = {
  videoId: string;
  title: string;
  durationSec: number | null;
  projection: "equirect" | "eac" | "unknown";
  fileName: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  qualityLabel: string | null;
  proxyPath: string;
};

export async function resolveYoutubeForLocalSave(
  rawUrl: string,
  onStatus?: (message: string) => void,
): Promise<ResolvedYoutubeMedia> {
  onStatus?.("Resolving YouTube media…");
  const response = await fetch("/api/cubemap/youtube/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: rawUrl }),
  });

  const payload = (await response.json()) as Partial<ResolvedYoutubeMedia> & {
    error?: string;
    ok?: boolean;
  };

  if (!response.ok || !payload.proxyPath || !payload.fileName) {
    throw new Error(payload.error || "Could not resolve YouTube media.");
  }

  return {
    videoId: payload.videoId ?? "",
    title: payload.title ?? "YouTube video",
    durationSec:
      typeof payload.durationSec === "number" ? payload.durationSec : null,
    projection:
      payload.projection === "equirect" || payload.projection === "eac"
        ? payload.projection
        : "unknown",
    fileName: payload.fileName,
    mimeType: payload.mimeType ?? "video/mp4",
    width: typeof payload.width === "number" ? payload.width : null,
    height: typeof payload.height === "number" ? payload.height : null,
    qualityLabel: payload.qualityLabel ?? null,
    proxyPath: payload.proxyPath,
  };
}
