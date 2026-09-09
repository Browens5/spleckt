"use client";

/**
 * Browser-side YouTube helpers (youtubei.js web build).
 * No yt-dlp / ffmpeg — resolves streams in the user's browser, then downloads
 * through our same-origin proxy (avoids googlevideo CORS) into a local folder.
 */

export type ResolvedYoutubeMedia = {
  videoId: string;
  title: string;
  durationSec: number | null;
  /** Best-effort guess for Cubemap input projection. */
  projection: "equirect" | "eac" | "unknown";
  fileName: string;
  /** Direct media URL (usually googlevideo) — must be fetched via proxy. */
  streamUrl: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  qualityLabel: string | null;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function parseYoutubeUrlClient(raw: string): {
  videoId: string;
  canonicalUrl: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Paste a YouTube URL first.");

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("That does not look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("YouTube links must use http(s).");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const hostWithWww = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostWithWww) && !YOUTUBE_HOSTS.has(host) && host !== "youtu.be") {
    throw new Error("Only youtube.com / youtu.be links are supported.");
  }

  let videoId = "";
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (url.pathname.startsWith("/shorts/")) {
    videoId = url.pathname.split("/")[2] ?? "";
  } else if (url.pathname.startsWith("/embed/")) {
    videoId = url.pathname.split("/")[2] ?? "";
  } else if (url.pathname.startsWith("/live/")) {
    videoId = url.pathname.split("/")[2] ?? "";
  } else {
    videoId = url.searchParams.get("v") ?? "";
  }

  videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
    throw new Error("Could not find a YouTube video id in that link.");
  }

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

function sanitizeFileName(title: string, videoId: string) {
  const base = (title || videoId)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base || videoId}.mp4`;
}

function guessProjection(info: {
  is_vr?: boolean;
  title?: string | null;
  width?: number | null;
  height?: number | null;
}): "equirect" | "eac" | "unknown" {
  if (info.is_vr) return "eac";
  const title = `${info.title ?? ""}`.toLowerCase();
  if (/\b(360|vr|eac|equirect|spherical)\b/.test(title)) return "eac";
  if (info.width && info.height && info.height > 0) {
    const ratio = info.width / info.height;
    // YouTube EAC atlases are typically ~3:2. Equirect is ~2:1.
    if (ratio > 1.4 && ratio < 1.7) return "eac";
    if (ratio > 1.9 && ratio < 2.15) return "equirect";
  }
  return "unknown";
}

type LooseFormat = {
  itag?: number;
  url?: string;
  mime_type?: string;
  quality_label?: string;
  width?: number;
  height?: number;
  has_audio?: boolean;
  has_video?: boolean;
  bitrate?: number;
  average_bitrate?: number;
};

function pickBestFormat(formats: LooseFormat[]): LooseFormat {
  const progressive = formats.filter(
    (f) => f.has_video && f.has_audio && typeof f.url === "string" && f.url.length > 0,
  );
  const pool =
    progressive.length > 0
      ? progressive
      : formats.filter((f) => f.has_video && typeof f.url === "string" && f.url.length > 0);

  if (pool.length === 0) {
    throw new Error(
      "No downloadable video formats were returned. YouTube may be blocking this session — try again later, or choose a local file instead.",
    );
  }

  pool.sort((a, b) => {
    const ah = a.height ?? 0;
    const bh = b.height ?? 0;
    if (ah !== bh) return bh - ah;
    return (b.average_bitrate ?? b.bitrate ?? 0) - (a.average_bitrate ?? a.bitrate ?? 0);
  });

  return pool[0]!;
}

/**
 * Resolve a YouTube watch URL to a direct media URL using youtubei.js in the browser.
 */
export async function resolveYoutubeInBrowser(
  rawUrl: string,
  onStatus?: (message: string) => void,
): Promise<ResolvedYoutubeMedia> {
  const { videoId } = parseYoutubeUrlClient(rawUrl);
  onStatus?.("Resolving YouTube media in your browser…");

  // Use the web build so deciphering runs on the user's connection (no server binaries).
  const { Innertube } = await import("youtubei.js/web");
  const yt = await Innertube.create({
    retrieve_player: true,
    generate_session_locally: true,
  });

  onStatus?.("Fetching stream list…");
  const info = await yt.getInfo(videoId);
  const title = info.basic_info?.title ?? videoId;
  const durationSec =
    typeof info.basic_info?.duration === "number" && Number.isFinite(info.basic_info.duration)
      ? info.basic_info.duration
      : null;

  const streaming = info.streaming_data;
  const allFormats: LooseFormat[] = [
    ...((streaming?.formats as LooseFormat[] | undefined) ?? []),
    ...((streaming?.adaptive_formats as LooseFormat[] | undefined) ?? []),
  ];

  let chosen: LooseFormat;
  try {
    // Prefer API helper when streaming data is intact.
    const format = info.chooseFormat({
      type: "video+audio",
      quality: "best",
      format: "mp4",
    }) as LooseFormat;
    if (!format?.url) throw new Error("Format missing URL");
    chosen = format;
  } catch {
    chosen = pickBestFormat(allFormats);
  }

  // Some formats need deciphering — youtubei.js usually populates .url after chooseFormat.
  if (!chosen.url) {
    throw new Error(
      "Could not obtain a media URL from YouTube. Try again, or choose a local video file instead.",
    );
  }

  const width = chosen.width ?? null;
  const height = chosen.height ?? null;
  const projection = guessProjection({
    is_vr: Boolean((info.basic_info as { is_vr?: boolean } | undefined)?.is_vr),
    title,
    width,
    height,
  });

  return {
    videoId,
    title,
    durationSec,
    projection,
    fileName: sanitizeFileName(title, videoId),
    streamUrl: chosen.url,
    mimeType: chosen.mime_type?.split(";")[0]?.trim() || "video/mp4",
    width,
    height,
    qualityLabel: chosen.quality_label ?? null,
  };
}

export function youtubeProxyUrl(streamUrl: string) {
  return `/api/cubemap/youtube/proxy?url=${encodeURIComponent(streamUrl)}`;
}
