import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export type YoutubeProjection = "equirect" | "eac" | "unknown";

export type YoutubeJobInfo = {
  id: string;
  videoId: string;
  title: string;
  durationSec: number | null;
  projection: YoutubeProjection;
  width: number | null;
  height: number | null;
  sourcePath: string;
  equirectPath: string | null;
  createdAt: number;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

export function getYoutubeDataDir() {
  const root = path.join(process.cwd(), ".data", "youtube");
  mkdirSync(root, { recursive: true });
  return root;
}

export function parseYoutubeUrl(raw: string): { videoId: string; canonicalUrl: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Paste a YouTube URL first.");
  }

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

function resolveYtDlpBin() {
  const fromEnv = process.env.YT_DLP_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const candidates = [
    "yt-dlp",
    path.join(process.env.HOME ?? "", ".local/bin/yt-dlp"),
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate === "yt-dlp") return candidate;
    if (existsSync(candidate)) return candidate;
  }
  return "yt-dlp";
}

function resolveFfmpegBin() {
  return process.env.FFMPEG_PATH?.trim() || "ffmpeg";
}

function runCommand(
  command: string,
  args: string[],
  options?: { cwd?: string; timeoutMs?: number },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      env: {
        ...process.env,
        PATH: `${process.env.HOME ?? ""}/.local/bin:${process.env.HOME ?? ""}/.deno/bin:${process.env.PATH ?? ""}`,
      },
    });
    let stdout = "";
    let stderr = "";
    const timer =
      options?.timeoutMs && options.timeoutMs > 0
        ? setTimeout(() => {
            child.kill("SIGKILL");
            reject(new Error(`${command} timed out after ${options.timeoutMs}ms`));
          }, options.timeoutMs)
        : null;

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const detail = (stderr || stdout).trim().split("\n").slice(-8).join("\n");
      reject(new Error(detail || `${command} exited with code ${code}`));
    });
  });
}

export function isYoutubeImportEnabledByEnv() {
  const flag = process.env.CUBEMAP_YOUTUBE_ENABLED?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off" || flag === "no") {
    return false;
  }
  return true;
}

export async function assertYoutubeTools() {
  if (!isYoutubeImportEnabledByEnv()) {
    throw new Error(
      "YouTube import is disabled on this host (CUBEMAP_YOUTUBE_ENABLED=0). Enable it on a self-hosted runtime with yt-dlp and ffmpeg.",
    );
  }
  try {
    await runCommand(resolveYtDlpBin(), ["--version"], { timeoutMs: 15_000 });
  } catch {
    throw new Error(
      "yt-dlp is not available on this server. Install yt-dlp (and optionally Deno for YouTube JS challenges) to enable YouTube import.",
    );
  }
  try {
    await runCommand(resolveFfmpegBin(), ["-version"], { timeoutMs: 15_000 });
  } catch {
    throw new Error("ffmpeg is required to convert YouTube EAC video into equirectangular frames.");
  }
}

type YtDlpFormat = {
  format_id?: string;
  ext?: string;
  width?: number;
  height?: number;
  vcodec?: string;
  acodec?: string;
  protocol?: string;
  format_note?: string;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
};

type YtDlpInfo = {
  id?: string;
  title?: string;
  duration?: number;
  width?: number;
  height?: number;
  projection?: string;
  formats?: YtDlpFormat[];
  requested_formats?: YtDlpFormat[];
};

function detectProjection(info: YtDlpInfo, width: number | null, height: number | null): YoutubeProjection {
  // Prefer explicit metadata only. Aspect ratio alone is unreliable (ordinary
  // 3:2 footage is not EAC), so we never classify EAC from dimensions.
  const label = `${info.projection ?? ""}`.toLowerCase();
  if (label.includes("equiangular") || label.includes("eac")) return "eac";
  if (label.includes("equirect")) return "equirect";
  if (width && height && height > 0) {
    const ratio = width / height;
    if (ratio > 1.9 && ratio < 2.15) return "equirect";
  }
  return "unknown";
}

export async function fetchYoutubeMetadata(url: string): Promise<YtDlpInfo> {
  const bin = resolveYtDlpBin();
  const args = [
    "--dump-single-json",
    "--no-playlist",
    "--no-warnings",
    "--js-runtimes",
    "deno",
  ];
  const cookies = process.env.YOUTUBE_COOKIES_FILE?.trim();
  if (cookies && existsSync(cookies)) {
    args.push("--cookies", cookies);
  }
  args.push(url);

  try {
    const { stdout } = await runCommand(bin, args, { timeoutMs: 120_000 });
    return JSON.parse(stdout) as YtDlpInfo;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/sign in to confirm|not a bot|cookies/i.test(message)) {
      throw new Error(
        "YouTube asked for a sign-in/bot check. Set YOUTUBE_COOKIES_FILE to an exported cookies.txt from a logged-in browser, then retry.",
      );
    }
    throw new Error(`Could not read YouTube metadata: ${message}`);
  }
}

function pickDownloadFormat(info: YtDlpInfo) {
  const formats = (info.formats ?? []).filter(
    (format) =>
      format.vcodec &&
      format.vcodec !== "none" &&
      typeof format.height === "number" &&
      format.height > 0 &&
      !String(format.protocol ?? "").includes("m3u8"),
  );

  // Prefer progressive MP4/WebM when possible; otherwise highest video-only.
  const progressive = formats.filter(
    (format) => format.acodec && format.acodec !== "none" && (format.ext === "mp4" || format.ext === "webm"),
  );
  const pool = progressive.length > 0 ? progressive : formats;
  pool.sort((a, b) => {
    const ah = a.height ?? 0;
    const bh = b.height ?? 0;
    if (ah !== bh) return bh - ah;
    return (b.tbr ?? 0) - (a.tbr ?? 0);
  });
  return pool[0] ?? null;
}

export async function downloadYoutubeVideo(options: {
  url: string;
  videoId: string;
  jobId: string;
}): Promise<YoutubeJobInfo> {
  assertSafeJobId(options.jobId);
  await assertYoutubeTools();
  const info = await fetchYoutubeMetadata(options.url);
  const title = (info.title ?? options.videoId).slice(0, 180);
  const durationSec =
    typeof info.duration === "number" && Number.isFinite(info.duration)
      ? info.duration
      : null;

  const jobDir = path.join(getYoutubeDataDir(), options.jobId);
  mkdirSync(jobDir, { recursive: true });
  const outTemplate = path.join(jobDir, "source.%(ext)s");

  const format = pickDownloadFormat(info);
  const bin = resolveYtDlpBin();
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--js-runtimes",
    "deno",
    "-o",
    outTemplate,
    "--merge-output-format",
    "mp4",
  ];
  if (format?.format_id) {
    // Prefer selected video; allow bestaudio merge when video-only.
    const hasAudio = Boolean(format.acodec && format.acodec !== "none");
    args.push("-f", hasAudio ? format.format_id : `${format.format_id}+bestaudio/best`);
  } else {
    args.push("-f", "bv*+ba/b");
  }
  const cookies = process.env.YOUTUBE_COOKIES_FILE?.trim();
  if (cookies && existsSync(cookies)) {
    args.push("--cookies", cookies);
  }
  args.push(options.url);

  try {
    await runCommand(bin, args, { cwd: jobDir, timeoutMs: 15 * 60_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/sign in to confirm|not a bot|cookies/i.test(message)) {
      throw new Error(
        "YouTube blocked the download (bot check). Export cookies.txt from a logged-in browser and set YOUTUBE_COOKIES_FILE.",
      );
    }
    throw new Error(`YouTube download failed: ${message}`);
  }

  const files = await fs.readdir(jobDir);
  const sourceName = files.find((name) => name.startsWith("source."));
  if (!sourceName) {
    throw new Error("Download finished but no media file was written.");
  }
  const sourcePath = path.join(jobDir, sourceName);

  // Probe actual dimensions after download when metadata is incomplete.
  let width = typeof info.width === "number" ? info.width : format?.width ?? null;
  let height = typeof info.height === "number" ? info.height : format?.height ?? null;
  try {
    const probe = await runCommand(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0",
        sourcePath,
      ],
      { timeoutMs: 30_000 },
    );
    const [w, h] = probe.stdout.trim().split(",").map((value) => Number(value));
    if (Number.isFinite(w) && Number.isFinite(h)) {
      width = w;
      height = h;
    }
  } catch {
    // Keep metadata dimensions.
  }

  const projection = detectProjection(info, width, height);
  const meta: YoutubeJobInfo = {
    id: options.jobId,
    videoId: options.videoId,
    title,
    durationSec,
    projection,
    width,
    height,
    sourcePath,
    equirectPath: null,
    createdAt: Date.now(),
  };
  await fs.writeFile(path.join(jobDir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
  return meta;
}

/**
 * Convert a YouTube EAC (or unknown 3x2) clip into equirectangular MP4 for the
 * existing browser cubemap pipeline. Optional start/end trim the conversion.
 */
export async function convertYoutubeToEquirect(options: {
  job: YoutubeJobInfo;
  startTimeSec?: number;
  endTimeSec?: number | null;
  forceEac?: boolean;
}): Promise<YoutubeJobInfo> {
  const { job } = options;
  const treatAsEac = Boolean(options.forceEac) || job.projection === "eac";
  const outPath = path.join(path.dirname(job.sourcePath), "equirect.mp4");

  const args = ["-y"];
  if (typeof options.startTimeSec === "number" && options.startTimeSec > 0) {
    args.push("-ss", String(options.startTimeSec));
  }
  args.push("-i", job.sourcePath);
  if (
    typeof options.endTimeSec === "number" &&
    options.endTimeSec != null &&
    Number.isFinite(options.endTimeSec)
  ) {
    const start = Math.max(0, options.startTimeSec ?? 0);
    const duration = Math.max(0.05, options.endTimeSec - start);
    args.push("-t", String(duration));
  }

  if (treatAsEac) {
    // Native EAC → equirect. Cap width to keep transfers practical.
    args.push(
      "-vf",
      "v360=eac:equirect:cubic,scale='min(3840,iw)':-2",
    );
  } else {
    // Already equirect — remux/transcode lightly, still allow trim.
    args.push("-vf", "scale='min(3840,iw)':-2");
  }

  args.push(
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outPath,
  );

  try {
    await runCommand(resolveFfmpegBin(), args, { timeoutMs: 20 * 60_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Fallback: treat packed 3x2 cubemap with YouTube face order/rotations.
    if (treatAsEac) {
      const fallback = ["-y"];
      if (typeof options.startTimeSec === "number" && options.startTimeSec > 0) {
        fallback.push("-ss", String(options.startTimeSec));
      }
      fallback.push("-i", job.sourcePath);
      if (
        typeof options.endTimeSec === "number" &&
        options.endTimeSec != null &&
        Number.isFinite(options.endTimeSec)
      ) {
        const start = Math.max(0, options.startTimeSec ?? 0);
        const duration = Math.max(0.05, options.endTimeSec - start);
        fallback.push("-t", String(duration));
      }
      fallback.push(
        "-vf",
        "v360=c3x2:equirect:cubic:in_forder=lfrdbu:in_frot=000313,scale='min(3840,iw)':-2",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outPath,
      );
      try {
        await runCommand(resolveFfmpegBin(), fallback, { timeoutMs: 20 * 60_000 });
      } catch {
        throw new Error(`EAC→equirect conversion failed: ${message}`);
      }
    } else {
      throw new Error(`Equirect prepare failed: ${message}`);
    }
  }

  const start = Math.max(0, options.startTimeSec ?? 0);
  const end =
    typeof options.endTimeSec === "number" && options.endTimeSec != null
      ? Math.max(start, options.endTimeSec)
      : null;
  const clipDurationSec =
    end != null
      ? Math.max(0.05, end - start)
      : job.durationSec != null
        ? Math.max(0.05, job.durationSec - start)
        : job.durationSec;

  const next: YoutubeJobInfo = {
    ...job,
    durationSec: clipDurationSec,
    equirectPath: outPath,
    projection: treatAsEac ? "eac" : job.projection,
  };
  await fs.writeFile(
    path.join(path.dirname(job.sourcePath), "meta.json"),
    JSON.stringify(next, null, 2),
    "utf8",
  );
  return next;
}

function assertSafeJobId(jobId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    throw new Error("Invalid YouTube job id.");
  }
}

export async function readYoutubeJob(jobId: string): Promise<YoutubeJobInfo | null> {
  assertSafeJobId(jobId);
  const jobDir = path.join(getYoutubeDataDir(), jobId);
  const metaPath = path.join(jobDir, "meta.json");
  if (!existsSync(metaPath)) return null;
  const raw = await fs.readFile(metaPath, "utf8");
  return JSON.parse(raw) as YoutubeJobInfo;
}

export function openYoutubeFileStream(jobId: string, filePath: string) {
  assertSafeJobId(jobId);
  const jobDir = path.resolve(getYoutubeDataDir(), jobId);
  const resolved = path.resolve(filePath);
  if (resolved !== jobDir && !resolved.startsWith(`${jobDir}${path.sep}`)) {
    throw new Error("Refusing to read a file outside the YouTube job directory.");
  }
  return Readable.toWeb(createReadStream(resolved)) as unknown as ReadableStream;
}

export function guessContentType(filePath: string) {
  if (filePath.endsWith(".webm")) return "video/webm";
  if (filePath.endsWith(".mkv")) return "video/x-matroska";
  return "video/mp4";
}
