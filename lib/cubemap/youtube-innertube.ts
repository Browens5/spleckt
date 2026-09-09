import { Innertube, Misc } from "youtubei.js";
import { parseYoutubeUrl } from "@/lib/cubemap/youtube";

type Format = Misc.Format;

export type ResolvedYoutubeDownload = {
  videoId: string;
  title: string;
  durationSec: number | null;
  projection: "equirect" | "eac" | "unknown";
  fileName: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  qualityLabel: string | null;
  /** Deciphered googlevideo (or similar) URL safe to proxy. */
  streamUrl: string;
};

function sanitizeFileName(title: string, videoId: string) {
  const base = (title || videoId)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base || videoId}.mp4`;
}

function guessProjection(info: {
  isVr?: boolean;
  title?: string | null;
  width?: number | null;
  height?: number | null;
}): "equirect" | "eac" | "unknown" {
  if (info.isVr) return "eac";
  const title = `${info.title ?? ""}`.toLowerCase();
  if (/\b(360|vr|eac|equirect|spherical)\b/.test(title)) return "eac";
  if (info.width && info.height && info.height > 0) {
    const ratio = info.width / info.height;
    if (ratio > 1.4 && ratio < 1.7) return "eac";
    if (ratio > 1.9 && ratio < 2.15) return "equirect";
  }
  return "unknown";
}

function formatScore(format: Format) {
  const height = format.height ?? 0;
  const bitrate = format.average_bitrate ?? format.bitrate ?? 0;
  const hasAudio = Boolean(format.has_audio);
  // Prefer muxed progressive (video+audio) for browser playback without ffmpeg.
  return (hasAudio ? 1_000_000_000 : 0) + height * 1000 + bitrate;
}

function pickBestFormat(formats: Format[]): Format {
  const withUrlOrCipher = formats.filter(
    (f) =>
      Boolean(f.has_video) &&
      (Boolean(f.url) || Boolean(f.signature_cipher) || Boolean(f.cipher)),
  );
  if (withUrlOrCipher.length === 0) {
    throw new Error(
      "No downloadable video formats were returned. YouTube may be blocking this host — try again later, or Choose file with a local copy.",
    );
  }

  const sorted = [...withUrlOrCipher].sort(
    (a, b) => formatScore(b) - formatScore(a),
  );
  return sorted[0]!;
}

/**
 * Resolve a YouTube watch URL to a direct media URL using youtubei.js (npm only —
 * no yt-dlp / ffmpeg binaries).
 */
export async function resolveYoutubeDownload(
  rawUrl: string,
): Promise<ResolvedYoutubeDownload> {
  const { videoId } = parseYoutubeUrl(rawUrl);

  let yt: Innertube;
  try {
    yt = await Innertube.create({
      retrieve_player: true,
      generate_session_locally: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not start YouTube session: ${message}`);
  }

  let info: Awaited<ReturnType<Innertube["getInfo"]>>;
  try {
    info = await yt.getInfo(videoId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/sign in|bot|confirm you/i.test(message)) {
      throw new Error(
        "YouTube asked for a sign-in/bot check on this host. Use Choose file with a video you already have, or set YOUTUBE_COOKIES_FILE on a self-hosted deploy.",
      );
    }
    throw new Error(`Could not read YouTube video info: ${message}`);
  }

  const title = info.basic_info?.title ?? videoId;
  const durationSec =
    typeof info.basic_info?.duration === "number" &&
    Number.isFinite(info.basic_info.duration)
      ? info.basic_info.duration
      : null;

  const streaming = info.streaming_data;
  const allFormats: Format[] = [
    ...(streaming?.formats ?? []),
    ...(streaming?.adaptive_formats ?? []),
  ];

  let chosen: Format;
  try {
    chosen = info.chooseFormat({
      type: "video+audio",
      quality: "best",
      format: "mp4",
    });
  } catch {
    try {
      chosen = pickBestFormat(allFormats);
    } catch {
      try {
        chosen = info.chooseFormat({
          type: "video",
          quality: "best",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `No downloadable formats for this video (${message}). Choose a local file instead.`,
        );
      }
    }
  }

  let streamUrl = "";
  try {
    streamUrl = await chosen.decipher(yt.session.player);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not decipher YouTube media URL: ${message}`);
  }

  if (!streamUrl) {
    throw new Error(
      "Could not obtain a media URL from YouTube. Try again, or Choose file with a local copy.",
    );
  }

  const width = chosen.width ?? null;
  const height = chosen.height ?? null;
  const projection = guessProjection({
    isVr: Boolean(
      (info.basic_info as { is_vr?: boolean } | undefined)?.is_vr,
    ),
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
    mimeType: chosen.mime_type?.split(";")[0]?.trim() || "video/mp4",
    width,
    height,
    qualityLabel: chosen.quality_label ?? null,
    streamUrl,
  };
}
