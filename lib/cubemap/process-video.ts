import {
  EquirectCubemapRenderer,
  canvasToBlob,
  composeCross,
  composeStrip,
} from "@/lib/cubemap/equirect-to-cubemap";
import {
  downloadBlob,
  writeBlobToDirectory,
} from "@/lib/cubemap/fs-access";
import type {
  CubeFace,
  CubemapSettings,
  ProcessProgress,
} from "@/lib/cubemap/types";

export type ProcessVideoOptions = {
  file: File;
  settings: CubemapSettings;
  outputDirectory: FileSystemDirectoryHandle | null;
  signal?: AbortSignal;
  onProgress?: (progress: ProcessProgress) => void;
};

function padFrame(index: number, total: number) {
  const width = Math.max(4, String(total).length);
  return String(index).padStart(width, "0");
}

function extensionFor(format: CubemapSettings["format"]) {
  return format === "jpeg" ? "jpg" : format;
}

async function seekVideo(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < 0.001) return;
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Failed to seek video."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    try {
      video.currentTime = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.001));
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

function loadVideo(file: File, signal?: AbortSignal) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const url = URL.createObjectURL(file);

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };

    const onReady = () => {
      cleanup();
      resolve(video);
    };
    const onError = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load the selected video."));
    };
    const onAbort = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new DOMException("Cancelled", "AbortError"));
    };

    video.addEventListener("loadedmetadata", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
    video.src = url;
  });
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Cancelled", "AbortError");
  }
}

function yieldToUi() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export async function processEquirectVideo(options: ProcessVideoOptions) {
  const { file, settings, outputDirectory, signal, onProgress } = options;
  const faces = settings.faces;
  if (faces.length === 0) {
    throw new Error("Select at least one cube face to export.");
  }

  const startedAt = performance.now();
  let completedUnits = 0;
  const report = (partial: Partial<ProcessProgress> & Pick<ProcessProgress, "phase" | "message">) => {
    const totalUnits = partial.totalUnits ?? 0;
    const done = partial.completedUnits ?? completedUnits;
    const elapsed = performance.now() - startedAt;
    const rate = done > 0 ? elapsed / done : 0;
    const remaining = totalUnits > 0 && done > 0 ? Math.max(0, (totalUnits - done) * rate) : null;
    onProgress?.({
      phase: partial.phase,
      completedUnits: done,
      totalUnits,
      currentFrame: partial.currentFrame ?? 0,
      totalFrames: partial.totalFrames ?? 0,
      currentFace: partial.currentFace ?? null,
      message: partial.message,
      etaMs: remaining,
      percent: totalUnits > 0 ? Math.min(100, (done / totalUnits) * 100) : 0,
    });
  };

  report({ phase: "preparing", message: "Loading video…", totalUnits: 0, completedUnits: 0 });

  const video = await loadVideo(file, signal);
  const objectUrl = video.src;
  const renderer = new EquirectCubemapRenderer();
  const frameCanvas = document.createElement("canvas");
  const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: false });
  if (!frameCtx) {
    renderer.dispose();
    URL.revokeObjectURL(objectUrl);
    throw new Error("2D canvas unavailable.");
  }

  try {
    throwIfAborted(signal);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) throw new Error("Video duration is unavailable.");

    const fps = Math.max(0.05, settings.framesPerSecond);
    const interval = 1 / fps;
    const times: number[] = [];
    for (let t = 0; t < duration - 1e-4; t += interval) {
      times.push(Math.min(t, duration - 1e-4));
    }
    if (times.length === 0) times.push(0);

    const outputsPerFrame =
      settings.layout === "separate" ? faces.length : 1;
    const totalUnits = times.length * outputsPerFrame;
    const ext = extensionFor(settings.format);
    const jobFolder = `cubemap_${file.name.replace(/\.[^.]+$/, "")}_${Date.now()}`;

    report({
      phase: "extracting",
      message: `Extracting ${times.length} frame${times.length === 1 ? "" : "s"}…`,
      totalUnits,
      completedUnits: 0,
      currentFrame: 0,
      totalFrames: times.length,
    });

    frameCanvas.width = video.videoWidth || 2;
    frameCanvas.height = video.videoHeight || 2;

    for (let frameIndex = 0; frameIndex < times.length; frameIndex += 1) {
      throwIfAborted(signal);
      await seekVideo(video, times[frameIndex]!);
      throwIfAborted(signal);

      frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
      renderer.uploadEquirect(frameCanvas, frameCanvas.width, frameCanvas.height);

      const faceCanvases = new Map<CubeFace, HTMLCanvasElement>();
      for (const face of faces) {
        throwIfAborted(signal);
        report({
          phase: "extracting",
          message: `Frame ${frameIndex + 1}/${times.length} · ${face}`,
          totalUnits,
          completedUnits,
          currentFrame: frameIndex + 1,
          totalFrames: times.length,
          currentFace: face,
        });

        const faceCanvas = renderer.renderFace(
          face,
          settings.faceSize,
          settings.fovDegrees,
          settings.yawDegrees,
        );
        // Copy immediately — renderer reuses its canvas.
        const copy = document.createElement("canvas");
        copy.width = settings.faceSize;
        copy.height = settings.faceSize;
        const copyCtx = copy.getContext("2d");
        if (!copyCtx) throw new Error("2D canvas unavailable.");
        copyCtx.drawImage(faceCanvas, 0, 0);
        faceCanvases.set(face, copy);

        if (settings.layout === "separate") {
          const blob = await canvasToBlob(copy, settings.format, settings.quality);
          const relativePath = `${jobFolder}/frame_${padFrame(frameIndex + 1, times.length)}_${face}.${ext}`;
          report({
            phase: "writing",
            message: `Writing ${relativePath}`,
            totalUnits,
            completedUnits,
            currentFrame: frameIndex + 1,
            totalFrames: times.length,
            currentFace: face,
          });
          if (outputDirectory) {
            await writeBlobToDirectory(outputDirectory, relativePath, blob);
          } else {
            downloadBlob(blob, relativePath.split("/").join("_"));
          }
          completedUnits += 1;
          report({
            phase: "writing",
            message: `Wrote ${relativePath}`,
            totalUnits,
            completedUnits,
            currentFrame: frameIndex + 1,
            totalFrames: times.length,
            currentFace: face,
          });
          await yieldToUi();
        }
      }

      if (settings.layout !== "separate") {
        throwIfAborted(signal);
        const composed =
          settings.layout === "strip"
            ? composeStrip(faces, faceCanvases, settings.faceSize)
            : composeCross(faces, faceCanvases, settings.faceSize);
        const blob = await canvasToBlob(composed, settings.format, settings.quality);
        const relativePath = `${jobFolder}/frame_${padFrame(frameIndex + 1, times.length)}_${settings.layout}.${ext}`;
        report({
          phase: "writing",
          message: `Writing ${relativePath}`,
          totalUnits,
          completedUnits,
          currentFrame: frameIndex + 1,
          totalFrames: times.length,
          currentFace: null,
        });
        if (outputDirectory) {
          await writeBlobToDirectory(outputDirectory, relativePath, blob);
        } else {
          downloadBlob(blob, relativePath.split("/").join("_"));
        }
        completedUnits += 1;
        report({
          phase: "writing",
          message: `Wrote ${relativePath}`,
          totalUnits,
          completedUnits,
          currentFrame: frameIndex + 1,
          totalFrames: times.length,
          currentFace: null,
        });
        await yieldToUi();
      }
    }

    report({
      phase: "done",
      message: outputDirectory
        ? `Complete — files saved under “${jobFolder}” in your output folder.`
        : `Complete — ${completedUnits} file${completedUnits === 1 ? "" : "s"} downloaded.`,
      totalUnits,
      completedUnits: totalUnits,
      currentFrame: times.length,
      totalFrames: times.length,
      currentFace: null,
    });

    return { frames: times.length, files: completedUnits, folder: jobFolder };
  } finally {
    renderer.dispose();
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
}
