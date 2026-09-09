"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CubemapBrand } from "@/components/cubemap/CubemapBrand";
import { ProgressBar } from "@/components/cubemap/ProgressBar";
import {
  downloadBlob,
  pickInputSource,
  pickOutputDirectory,
  pickYoutubeDownloadDirectory,
  writeResponseToDirectory,
} from "@/lib/cubemap/fs-access";
import { processEquirectVideo } from "@/lib/cubemap/process-video";
import {
  formatDurationLabel,
  maxSampleFrameCount,
} from "@/lib/cubemap/sample-range";
import { resolveYoutubeForLocalSave } from "@/lib/cubemap/youtube-browser";
import { isVideoFile, isZipFile } from "@/lib/cubemap/zip-images";
import {
  CUBE_FACES,
  DEFAULT_CUBEMAP_SETTINGS,
  MASK_CLASSES,
  facesFromPreferences,
  type CubeFace,
  type CubemapSettings,
  type ImageFormat,
  type InputProjection,
  type MaskClass,
  type OutputLayout,
  type ProcessProgress,
  type RangeMode,
} from "@/lib/cubemap/types";

const IDLE_PROGRESS: ProcessProgress = {
  phase: "idle",
  completedUnits: 0,
  totalUnits: 0,
  currentFrame: 0,
  totalFrames: 0,
  currentFace: null,
  message: "",
  etaMs: null,
  percent: 0,
};

const SIDE_FACES: CubeFace[] = ["front", "right", "back", "left"];

async function probeVideoDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      const onMeta = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Unable to read video metadata."));
      };
      const cleanup = () => {
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeEventListener("error", onError);
      };
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      video.addEventListener("error", onError, { once: true });
    });
    return Number.isFinite(video.duration) ? video.duration : 0;
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

export function CubemapTool() {
  const [inputLabel, setInputLabel] = useState("");
  const [outputLabel, setOutputLabel] = useState("");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeStatus, setYoutubeStatus] = useState<string | null>(null);
  const [youtubeImporting, setYoutubeImporting] = useState(false);
  const [youtubeEnabled, setYoutubeEnabled] = useState<boolean | null>(null);
  const [youtubeDisabledReason, setYoutubeDisabledReason] = useState<string | null>(
    null,
  );
  const [outputDir, setOutputDir] = useState<FileSystemDirectoryHandle | null>(
    null,
  );
  const [settings, setSettings] = useState<CubemapSettings>(DEFAULT_CUBEMAP_SETTINGS);
  const [progress, setProgress] = useState<ProcessProgress>(IDLE_PROGRESS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const usingDownloadFallback = outputLabel === "Browser downloads (fallback)";
  const inputIsZip = Boolean(inputFile && isZipFile(inputFile));
  const rangeMode: RangeMode = inputIsZip ? "frame" : settings.rangeMode;

  const faceCount = settings.faces.length;
  const masksReady =
    !settings.exportMasks || settings.maskClasses.length > 0;
  const canRun =
    Boolean(inputFile) && faceCount > 0 && masksReady && !busy && !youtubeImporting;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/cubemap/youtube");
        const payload = (await response.json()) as {
          enabled?: boolean;
          error?: string;
        };
        if (cancelled) return;
        setYoutubeEnabled(Boolean(payload.enabled));
        setYoutubeDisabledReason(
          payload.enabled ? null : payload.error ?? "YouTube import unavailable on this host.",
        );
      } catch {
        if (cancelled) return;
        setYoutubeEnabled(false);
        setYoutubeDisabledReason("Could not reach the YouTube import API.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function applyInputFile(
    file: File,
    pathLabel: string,
    projection?: InputProjection,
  ) {
    setInputFile(file);
    setInputLabel(pathLabel);
    setVideoDurationSec(null);
    const nextProjection =
      projection ??
      (settings.inputProjection === "eac" ? "eac" : "equirect");
    updateSettings({
      startTimeSec: 0,
      endTimeSec: null,
      startFrame: 1,
      endFrame: null,
      inputProjection: nextProjection,
      ...(isZipFile(file) ? { rangeMode: "frame" as const } : {}),
    });

    if (isVideoFile(file)) {
      try {
        const duration = await probeVideoDuration(file);
        setVideoDurationSec(duration > 0 ? duration : null);
      } catch {
        setVideoDurationSec(null);
      }
    }
  }

  async function onSaveYoutubeLocally() {
    if (busy || youtubeImporting) return;
    if (!youtubeUrl.trim()) {
      setError("Paste a YouTube URL first.");
      return;
    }
    setError(null);
    setYoutubeImporting(true);
    setYoutubeStatus("Resolving YouTube media…");
    try {
      const resolved = await resolveYoutubeForLocalSave(youtubeUrl, (message) => {
        setYoutubeStatus(message);
      });

      setYoutubeStatus(`Choose a local folder to save “${resolved.title}”…`);
      const folder = await pickYoutubeDownloadDirectory();

      setYoutubeStatus(
        `Downloading${resolved.qualityLabel ? ` ${resolved.qualityLabel}` : ""} to ${folder.pathLabel}…`,
      );

      const response = await fetch(resolved.proxyPath);
      if (!response.ok) {
        let detail = `Download failed (HTTP ${response.status}).`;
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) detail = payload.error;
        } catch {
          // ignore non-JSON error bodies
        }
        throw new Error(detail);
      }

      let file: File;
      if (folder.handle) {
        const fileHandle = await writeResponseToDirectory(
          folder.handle,
          resolved.fileName,
          response,
          (received, total) => {
            if (total && total > 0) {
              const pct = Math.min(99, Math.round((received / total) * 100));
              setYoutubeStatus(`Downloading to ${folder.pathLabel}… ${pct}%`);
            } else {
              const mb = (received / (1024 * 1024)).toFixed(1);
              setYoutubeStatus(`Downloading to ${folder.pathLabel}… ${mb} MB`);
            }
          },
        );
        file = await fileHandle.getFile();
        setYoutubeStatus(
          `Saved ${resolved.fileName} to “${folder.pathLabel}”. Loading into Cubemap…`,
        );
      } else {
        const blob = await response.blob();
        file = new File([blob], resolved.fileName, {
          type: resolved.mimeType || blob.type || "video/mp4",
        });
        downloadBlob(blob, resolved.fileName);
        setYoutubeStatus(
          `Saved ${resolved.fileName} to your downloads folder. Loading into Cubemap…`,
        );
      }

      // Prefer metadata; for unknown 360-style titles default to EAC so YouTube 360 works.
      const projection: InputProjection =
        resolved.projection === "equirect"
          ? "equirect"
          : resolved.projection === "eac"
            ? "eac"
            : "eac";

      await applyInputFile(
        file,
        `${resolved.title} (saved locally)`,
        projection,
      );

      if (projection === "eac") {
        updateSettings({ inputProjection: "eac" });
      }

      setYoutubeStatus(
        `Ready: ${resolved.title} saved locally` +
          (projection === "eac"
            ? " · input projection set to YouTube EAC (3×2)"
            : " · ready to extract cubemap faces"),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setYoutubeStatus(null);
        return;
      }
      const message =
        err instanceof Error ? err.message : "YouTube local save failed.";
      setError(
        `${message} You can still Choose file if you already have the video on disk.`,
      );
      setYoutubeStatus(null);
    } finally {
      setYoutubeImporting(false);
    }
  }

  async function onImportYoutubeServer() {
    if (busy || youtubeImporting || youtubeEnabled === false) return;
    setError(null);
    setYoutubeStatus("Contacting host YouTube import (optional)…");
    setYoutubeImporting(true);
    try {
      const response = await fetch("/api/cubemap/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl,
          startTimeSec:
            settings.rangeMode === "time" ? settings.startTimeSec : undefined,
          endTimeSec:
            settings.rangeMode === "time" ? settings.endTimeSec : undefined,
          forceEac: settings.inputProjection === "eac",
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        downloadPath?: string;
        fileName?: string;
        title?: string;
        durationSec?: number | null;
        projection?: string;
        note?: string;
      };
      if (!response.ok || !payload.downloadPath) {
        throw new Error(payload.error || "Host YouTube import failed.");
      }

      setYoutubeStatus(
        payload.note ??
          "Host download ready — loading prepared equirect into the tool…",
      );
      const media = await fetch(payload.downloadPath);
      if (!media.ok) {
        throw new Error("Could not download the prepared equirect clip.");
      }
      const blob = await media.blob();
      const file = new File(
        [blob],
        payload.fileName || "youtube-equirect.mp4",
        { type: blob.type || "video/mp4" },
      );
      await applyInputFile(
        file,
        `${payload.title ?? "YouTube"} (host import)`,
        "equirect",
      );
      setYoutubeStatus(
        `Ready: ${payload.title ?? "YouTube video"} · host prepared equirect`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Host YouTube import failed.";
      setError(
        `${message} Try “Save to folder & process” instead — it works without yt-dlp.`,
      );
      setYoutubeStatus(null);
    } finally {
      setYoutubeImporting(false);
    }
  }

  const sampleFrameCount = useMemo(() => {
    if (videoDurationSec == null || videoDurationSec <= 0) return null;
    return maxSampleFrameCount(videoDurationSec, settings.framesPerSecond);
  }, [videoDurationSec, settings.framesPerSecond]);

  const estimatedExportCount = useMemo(() => {
    if (inputIsZip) {
      if (settings.endFrame == null) return null;
      return Math.max(
        0,
        Math.floor(settings.endFrame) -
          Math.max(1, Math.floor(settings.startFrame)) +
          1,
      );
    }
    if (rangeMode === "frame") {
      if (sampleFrameCount == null) return null;
      const start = Math.max(1, Math.floor(settings.startFrame));
      const end =
        settings.endFrame == null
          ? sampleFrameCount
          : Math.min(sampleFrameCount, Math.floor(settings.endFrame));
      return Math.max(0, end - start + 1);
    }
    if (videoDurationSec == null || videoDurationSec <= 0) return null;
    const start = Math.max(0, settings.startTimeSec);
    const end =
      settings.endTimeSec == null
        ? videoDurationSec
        : Math.min(videoDurationSec, Math.max(0, settings.endTimeSec));
    if (!(end > start)) return 0;
    const fps = Math.max(0.05, settings.framesPerSecond);
    const interval = 1 / fps;
    let count = 0;
    for (let t = start; t < end - 1e-4; t += interval) count += 1;
    return Math.max(1, count);
  }, [
    inputIsZip,
    rangeMode,
    sampleFrameCount,
    settings.endFrame,
    settings.endTimeSec,
    settings.framesPerSecond,
    settings.startFrame,
    settings.startTimeSec,
    videoDurationSec,
  ]);

  function toggleMaskClass(maskClass: MaskClass) {
    const exists = settings.maskClasses.includes(maskClass);
    const maskClasses = exists
      ? settings.maskClasses.filter((value) => value !== maskClass)
      : [...settings.maskClasses, maskClass];
    updateSettings({ maskClasses });
  }

  const previewFaces = useMemo(() => settings.faces, [settings.faces]);

  async function onPickInput() {
    setError(null);
    setYoutubeStatus(null);
    try {
      const picked = await pickInputSource();
      await applyInputFile(picked.file, picked.pathLabel);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not open input file.");
    }
  }

  async function onPickOutput() {
    setError(null);
    try {
      const picked = await pickOutputDirectory();
      setOutputDir(picked.handle);
      setOutputLabel(picked.pathLabel);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not open output folder.");
    }
  }

  function updateSettings(patch: Partial<CubemapSettings>) {
    startTransition(() => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if ("includeTopBottom" in patch || "faces" in patch) {
          const selected = patch.faces ?? prev.faces;
          const include =
            patch.includeTopBottom ?? prev.includeTopBottom;
          next.includeTopBottom = include;
          next.faces = facesFromPreferences(include, selected);
        }
        return next;
      });
    });
  }

  function toggleFace(face: CubeFace) {
    if ((face === "top" || face === "bottom") && !settings.includeTopBottom) {
      return;
    }
    const exists = settings.faces.includes(face);
    const nextFaces = exists
      ? settings.faces.filter((f) => f !== face)
      : [...settings.faces, face];
    updateSettings({ faces: nextFaces });
  }

  function setFacesPerFrame(count: number) {
    const clamped = Math.min(6, Math.max(1, Math.round(count)));
    const pool: CubeFace[] = settings.includeTopBottom
      ? [...CUBE_FACES]
      : [...SIDE_FACES];
    updateSettings({ faces: pool.slice(0, clamped) });
  }

  async function onStart() {
    if (!inputFile || busy) return;
    setError(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const effectiveSettings: CubemapSettings = inputIsZip
      ? { ...settings, rangeMode: "frame" }
      : settings;
    try {
      await processEquirectVideo({
        file: inputFile,
        settings: effectiveSettings,
        outputDirectory: outputDir,
        signal: controller.signal,
        onProgress: setProgress,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setProgress((prev) => ({
          ...prev,
          phase: "cancelled",
          message: "Cancelled by user",
          etaMs: null,
        }));
      } else {
        const message =
          err instanceof Error ? err.message : "Conversion failed.";
        setError(message);
        setProgress((prev) => ({
          ...prev,
          phase: "error",
          message,
          etaMs: null,
        }));
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  function onCancel() {
    abortRef.current?.abort();
  }

  return (
    <div className="cm-shell">
      <div className="cm-atmosphere" aria-hidden>
        <div className="cm-atmosphere__grid" />
        <div className="cm-atmosphere__glow" />
        <div className="cm-atmosphere__cube" />
      </div>

      <header className="cm-header">
        <div className="cm-header__inner">
          <CubemapBrand />
          <p className="cm-header__privacy">Cubemap projection stays in your browser</p>
        </div>
      </header>

      <main className="cm-main">
        <section className="cm-hero">
          <motion.p
            className="cm-brand-hero"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Cubemap
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            Equirect 360 video to cube faces
          </motion.h1>
          <motion.p
            className="cm-hero__lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            Extract frames from an equirectangular video, a YouTube 360 EAC
            link, or a ZIP of still frames — trim to a start/end window, project
            selected cube faces with custom FOV, and write images straight to a
            local folder.
          </motion.p>
        </section>

        <motion.section
          className="cm-panel"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Conversion controls"
        >
          <div className="cm-paths">
            <div className="cm-path">
              <label htmlFor="cm-input-path">Input video or ZIP</label>
              <div className="cm-path__row">
                <input
                  id="cm-input-path"
                  readOnly
                  value={inputLabel}
                  placeholder="Select an equirectangular MP4 or a ZIP of frames…"
                />
                <button type="button" className="cm-btn cm-btn--secondary" onClick={onPickInput} disabled={busy || youtubeImporting}>
                  Choose file
                </button>
              </div>
              {inputIsZip ? (
                <p className="cm-hint">
                  ZIP detected — each image is processed as one equirect frame
                  (sorted by filename). Use start/end frame to limit the export.
                  Frames-per-second applies to video only.
                </p>
              ) : videoDurationSec != null ? (
                <p className="cm-hint">
                  Duration {formatDurationLabel(videoDurationSec)}
                  {sampleFrameCount != null
                    ? ` · ${sampleFrameCount} sample${sampleFrameCount === 1 ? "" : "s"} at ${settings.framesPerSecond} FPS`
                    : ""}
                </p>
              ) : null}
            </div>

            <div className="cm-path">
              <label htmlFor="cm-youtube-url">YouTube 360 link</label>
              <div className="cm-path__row">
                <input
                  id="cm-youtube-url"
                  value={youtubeUrl}
                  placeholder="https://www.youtube.com/watch?v=…"
                  disabled={busy || youtubeImporting}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="cm-btn cm-btn--secondary"
                  onClick={onSaveYoutubeLocally}
                  disabled={busy || youtubeImporting || !youtubeUrl.trim()}
                >
                  {youtubeImporting ? "Working…" : "Save to folder & process"}
                </button>
              </div>
              {youtubeEnabled ? (
                <div className="cm-path__row cm-path__row--tight">
                  <button
                    type="button"
                    className="cm-btn cm-btn--ghost"
                    onClick={onImportYoutubeServer}
                    disabled={busy || youtubeImporting || !youtubeUrl.trim()}
                  >
                    Optional: host convert (yt-dlp)
                  </button>
                </div>
              ) : null}
              <p className="cm-hint">
                Saves the YouTube video into a folder you choose (Chrome/Edge), then
                loads it for cubemap export — no apps to install. 360/EAC videos
                are processed with Input projection set to YouTube EAC. If YouTube
                blocks the session, Choose file with a copy you already have.
              </p>
              {youtubeEnabled === false && youtubeDisabledReason ? (
                <p className="cm-hint">
                  Host convert unavailable ({youtubeDisabledReason}). Save to
                  folder still works without yt-dlp.
                </p>
              ) : null}
              {youtubeStatus ? (
                <p className="cm-hint cm-hint--status">{youtubeStatus}</p>
              ) : null}
              {error ? (
                <p className="cm-error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="cm-path">
              <label htmlFor="cm-output-path">Output folder</label>
              <div className="cm-path__row">
                <input
                  id="cm-output-path"
                  readOnly
                  value={outputLabel}
                  placeholder="Select a folder for frames & cubemaps…"
                />
                <button
                  type="button"
                  className="cm-btn cm-btn--secondary"
                  onClick={onPickOutput}
                  disabled={busy}
                >
                  Choose folder
                </button>
              </div>
              {usingDownloadFallback ? (
                <p className="cm-hint">
                  This browser will download output files individually instead of
                  writing to a folder path.
                </p>
              ) : null}
            </div>
          </div>

          <div className="cm-grid">
            <label className="cm-field">
              <span>Frames per second</span>
              <input
                type="number"
                min={0.1}
                max={60}
                step={0.1}
                value={settings.framesPerSecond}
                disabled={busy || inputIsZip || youtubeImporting}
                onChange={(e) =>
                  updateSettings({
                    framesPerSecond: Number(e.target.value) || 1,
                  })
                }
              />
              {inputIsZip ? <em>Video only</em> : null}
            </label>

            <label className="cm-field">
              <span>Input projection</span>
              <select
                value={settings.inputProjection}
                disabled={busy || youtubeImporting}
                onChange={(e) =>
                  updateSettings({
                    inputProjection: e.target.value as InputProjection,
                  })
                }
              >
                <option value="equirect">Equirectangular</option>
                <option value="eac">YouTube EAC (3×2)</option>
              </select>
              <em>Use EAC for local YouTube 360 downloads</em>
            </label>

            <label className="cm-field">
              <span>Face size (px)</span>
              <input
                type="number"
                min={256}
                max={4096}
                step={64}
                value={settings.faceSize}
                disabled={busy}
                onChange={(e) =>
                  updateSettings({
                    faceSize: Math.max(64, Number(e.target.value) || 1024),
                  })
                }
              />
            </label>

            <label className="cm-field">
              <span>FOV (degrees)</span>
              <input
                type="number"
                min={40}
                max={120}
                step={1}
                value={settings.fovDegrees}
                disabled={busy}
                onChange={(e) =>
                  updateSettings({
                    fovDegrees: Math.min(
                      150,
                      Math.max(20, Number(e.target.value) || 90),
                    ),
                  })
                }
              />
            </label>

            <label className="cm-field">
              <span>Faces per frame</span>
              <input
                type="number"
                min={1}
                max={settings.includeTopBottom ? 6 : 4}
                step={1}
                value={faceCount}
                disabled={busy}
                onChange={(e) => setFacesPerFrame(Number(e.target.value) || 1)}
              />
            </label>

            <label className="cm-field">
              <span>Yaw offset (°)</span>
              <input
                type="number"
                min={-180}
                max={180}
                step={1}
                value={settings.yawDegrees}
                disabled={busy}
                onChange={(e) =>
                  updateSettings({
                    yawDegrees: Number(e.target.value) || 0,
                  })
                }
              />
            </label>

            <label className="cm-field">
              <span>Image format</span>
              <select
                value={settings.format}
                disabled={busy}
                onChange={(e) =>
                  updateSettings({ format: e.target.value as ImageFormat })
                }
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </label>

            <label className="cm-field">
              <span>Quality</span>
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.01}
                value={settings.quality}
                disabled={busy || settings.format === "png"}
                onChange={(e) =>
                  updateSettings({ quality: Number(e.target.value) })
                }
              />
              <em>{Math.round(settings.quality * 100)}%</em>
            </label>

            <label className="cm-field">
              <span>Output layout</span>
              <select
                value={settings.layout}
                disabled={busy}
                onChange={(e) =>
                  updateSettings({ layout: e.target.value as OutputLayout })
                }
              >
                <option value="separate">Separate face files</option>
                <option value="strip">Horizontal strip</option>
                <option value="cross">Cubemap cross</option>
              </select>
            </label>
          </div>

          <div className="cm-range">
            <div className="cm-faces__head">
              <h2>Export range</h2>
              <div
                className="cm-segment"
                role="group"
                aria-label="Range mode"
              >
                <button
                  type="button"
                  className={`cm-segment__btn${rangeMode === "time" ? " is-active" : ""}`}
                  aria-pressed={rangeMode === "time"}
                  disabled={busy || inputIsZip}
                  onClick={() => updateSettings({ rangeMode: "time" })}
                >
                  Time
                </button>
                <button
                  type="button"
                  className={`cm-segment__btn${rangeMode === "frame" ? " is-active" : ""}`}
                  aria-pressed={rangeMode === "frame"}
                  disabled={busy}
                  onClick={() => updateSettings({ rangeMode: "frame" })}
                >
                  Frame
                </button>
              </div>
            </div>
            <p className="cm-hint">
              {inputIsZip
                ? "Limit which ZIP images are exported (1-based, inclusive). Leave end empty for the last image."
                : rangeMode === "time"
                  ? "Only sample video between start and end times. Leave end empty for the full remaining duration."
                  : "Frame numbers follow the FPS grid from the start of the video (frame 1 = 0s). Leave end empty for the last sample."}
            </p>
            <div className="cm-grid cm-range__grid">
              {rangeMode === "time" && !inputIsZip ? (
                <>
                  <label className="cm-field">
                    <span>Start time (sec)</span>
                    <input
                      type="number"
                      min={0}
                      max={videoDurationSec ?? undefined}
                      step={0.1}
                      value={settings.startTimeSec}
                      disabled={busy}
                      onChange={(e) =>
                        updateSettings({
                          startTimeSec: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>
                  <label className="cm-field">
                    <span>End time (sec)</span>
                    <input
                      type="number"
                      min={0}
                      max={videoDurationSec ?? undefined}
                      step={0.1}
                      value={settings.endTimeSec ?? ""}
                      placeholder={
                        videoDurationSec != null
                          ? String(Number(videoDurationSec.toFixed(3)))
                          : "End of video"
                      }
                      disabled={busy}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === "") {
                          updateSettings({ endTimeSec: null });
                          return;
                        }
                        updateSettings({
                          endTimeSec: Math.max(0, Number(raw) || 0),
                        });
                      }}
                    />
                    <em>Empty = end of video</em>
                  </label>
                </>
              ) : (
                <>
                  <label className="cm-field">
                    <span>Start frame</span>
                    <input
                      type="number"
                      min={1}
                      max={sampleFrameCount ?? undefined}
                      step={1}
                      value={settings.startFrame}
                      disabled={busy}
                      onChange={(e) =>
                        updateSettings({
                          startFrame: Math.max(
                            1,
                            Math.floor(Number(e.target.value) || 1),
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="cm-field">
                    <span>End frame</span>
                    <input
                      type="number"
                      min={1}
                      max={sampleFrameCount ?? undefined}
                      step={1}
                      value={settings.endFrame ?? ""}
                      placeholder={
                        sampleFrameCount != null
                          ? String(sampleFrameCount)
                          : "Last frame"
                      }
                      disabled={busy}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === "") {
                          updateSettings({ endFrame: null });
                          return;
                        }
                        updateSettings({
                          endFrame: Math.max(1, Math.floor(Number(raw) || 1)),
                        });
                      }}
                    />
                    <em>Empty = last frame</em>
                  </label>
                </>
              )}
              <div className="cm-field cm-field--readonly">
                <span>Frames to export</span>
                <strong>
                  {estimatedExportCount == null
                    ? "—"
                    : estimatedExportCount}
                </strong>
              </div>
            </div>
          </div>

          <div className="cm-faces">
            <div className="cm-faces__head">
              <h2>Cube faces</h2>
              <label className="cm-toggle">
                <input
                  type="checkbox"
                  checked={settings.includeTopBottom}
                  disabled={busy}
                  onChange={(e) => {
                    const includeTopBottom = e.target.checked;
                    const nextSelected = includeTopBottom
                      ? Array.from(
                          new Set<CubeFace>([
                            ...settings.faces,
                            "top",
                            "bottom",
                          ]),
                        )
                      : settings.faces.filter(
                          (f) => f !== "top" && f !== "bottom",
                        );
                    updateSettings({ includeTopBottom, faces: nextSelected });
                  }}
                />
                <span>Include top / bottom</span>
              </label>
            </div>
            <div className="cm-faces__grid" role="group" aria-label="Select faces">
              {CUBE_FACES.map((face) => {
                const disabled =
                  busy ||
                  ((face === "top" || face === "bottom") &&
                    !settings.includeTopBottom);
                const checked = previewFaces.includes(face);
                return (
                  <button
                    key={face}
                    type="button"
                    className={`cm-face${checked ? " is-active" : ""}${disabled ? " is-disabled" : ""}`}
                    aria-pressed={checked}
                    disabled={disabled}
                    onClick={() => toggleFace(face)}
                  >
                    <span className="cm-face__glyph" data-face={face} />
                    <span>{face}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cm-masks">
            <div className="cm-faces__head">
              <h2>Photogrammetry masks</h2>
              <label className="cm-toggle">
                <input
                  type="checkbox"
                  checked={settings.exportMasks}
                  disabled={busy}
                  onChange={(e) =>
                    updateSettings({ exportMasks: e.target.checked })
                  }
                />
                <span>Export masks</span>
              </label>
            </div>
            <p className="cm-hint">
              Optional. Black pixels mark excluded regions (people, cars, sky)
              for Metashape / RealityCapture. Runs on-device; the segmentation
              model downloads only when masks are enabled.
            </p>
            <div
              className="cm-faces__grid cm-masks__grid"
              role="group"
              aria-label="Mask classes"
            >
              {MASK_CLASSES.map((maskClass) => {
                const checked = settings.maskClasses.includes(maskClass);
                return (
                  <button
                    key={maskClass}
                    type="button"
                    className={`cm-face${checked ? " is-active" : ""}${!settings.exportMasks || busy ? " is-disabled" : ""}`}
                    aria-pressed={checked}
                    disabled={!settings.exportMasks || busy}
                    onClick={() => toggleMaskClass(maskClass)}
                  >
                    <span className="cm-face__glyph" data-mask={maskClass} />
                    <span>{maskClass}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ProgressBar progress={progress} busy={busy} />

          <div className="cm-actions">
            <button
              type="button"
              className="cm-btn cm-btn--primary"
              disabled={!canRun}
              onClick={onStart}
            >
              {busy ? "Processing…" : "Extract cubemap"}
            </button>
            <button
              type="button"
              className="cm-btn cm-btn--ghost"
              disabled={!busy}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </motion.section>

        <section className="cm-notes" aria-label="How it works">
          <h2>Private by design</h2>
          <p>
            Cubemap projection, frame extraction, and optional mask inference run
            in your browser with WebGL. Local files never leave the device.
            YouTube “Save to folder & process” resolves the stream on the host with
            a JavaScript library (no yt-dlp/ffmpeg install), then proxies bytes so
            your browser can write the file to a folder you pick. Cubemap processing
            stays on-device. Only use videos you have rights to process.
          </p>
        </section>
      </main>

      <footer className="cm-footer">
        <span>Cubemap</span>
        <span>A Spleckt tool · cubemap.spleckt.com</span>
      </footer>
    </div>
  );
}
