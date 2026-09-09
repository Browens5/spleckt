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
import { buildEquirectExclusionMask } from "@/lib/cubemap/segment-masks";
import type {
  CubeFace,
  CubemapSettings,
  ProcessProgress,
} from "@/lib/cubemap/types";
import {
  buildVideoSampleTimes,
  sliceFrameRange,
} from "@/lib/cubemap/sample-range";
import {
  extractImagesFromZip,
  isVideoFile,
  isZipFile,
  loadImageBitmapFromBytes,
} from "@/lib/cubemap/zip-images";

export type ProcessVideoOptions = {
  file: File;
  settings: CubemapSettings;
  outputDirectory: FileSystemDirectoryHandle | null;
  signal?: AbortSignal;
  onProgress?: (progress: ProcessProgress) => void;
};

type FrameProvider = {
  kind: "video" | "images";
  frameCount: number;
  /** Draw frame index into the shared canvas; may resize the canvas. */
  drawFrame: (index: number, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => Promise<void>;
  dispose: () => void;
};

function padFrame(index: number, total: number) {
  const width = Math.max(4, String(total).length);
  return String(index).padStart(width, "0");
}

function extensionFor(format: CubemapSettings["format"]) {
  return format === "jpeg" ? "jpg" : format;
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

function waitForEvent(target: EventTarget, event: string, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const cleanup = () => {
      target.removeEventListener(event, onEvent);
      signal?.removeEventListener("abort", onAbort);
    };
    target.addEventListener(event, onEvent, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function waitForDecodedFrame(video: HTMLVideoElement) {
  // createImageBitmap resolves only once a decoded frame is available and does
  // not advance playback the way play()/pause() can.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(video);
      bitmap.close();
      return;
    } catch {
      // Fall through for browsers that reject video bitmaps while seeking.
    }
  }

  const mediaVideo = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (
      callback: (now: number, metadata: unknown) => void,
    ) => number;
    cancelVideoFrameCallback?: (handle: number) => void;
  };

  if (typeof mediaVideo.requestVideoFrameCallback === "function") {
    await new Promise<void>((resolve) => {
      const handle = mediaVideo.requestVideoFrameCallback!(() => {
        window.clearTimeout(timer);
        resolve();
      });
      const timer = window.setTimeout(() => {
        mediaVideo.cancelVideoFrameCallback?.(handle);
        resolve();
      }, 250);
    });
    return;
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function loadVideo(file: File, signal?: AbortSignal) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  // Helps some browsers decode the first frame before play.
  video.setAttribute("playsinline", "true");
  const url = URL.createObjectURL(file);
  video.src = url;

  try {
    throwIfAborted(signal);
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await Promise.race([
        waitForEvent(video, "loadeddata", signal),
        waitForEvent(video, "error", signal).then(() => {
          throw new Error("Unable to load the selected video.");
        }),
      ]);
    }

    // Force an initial decode at t=0 even when currentTime is already 0.
    await seekVideo(video, 0);
    return video;
  } catch (error) {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
    throw error;
  }
}

async function seekOnce(video: HTMLVideoElement, target: number) {
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      // Some browsers omit seeked when assigning the same/current time.
      finish();
    }, 1000);

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Failed to seek video."));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener("seeked", finish);
      video.removeEventListener("error", fail);
    };

    video.addEventListener("seeked", finish, { once: true });
    video.addEventListener("error", fail, { once: true });

    try {
      video.currentTime = target;
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

async function seekVideo(video: HTMLVideoElement, time: number) {
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const target = Math.min(
    Math.max(0, time),
    duration > 0 ? Math.max(0, duration - 0.001) : Math.max(0, time),
  );

  // Nudge away from the target first when we are already there (common at t=0
  // after load). That forces a real seeked + decoded frame instead of a black
  // canvas from an undecoded first frame.
  if (Math.abs(video.currentTime - target) < 0.0005 && duration > 0.05) {
    const nudge = target + 0.05 < duration - 0.001 ? target + 0.05 : Math.max(0, target - 0.05);
    await seekOnce(video, nudge);
  }

  await seekOnce(video, target);
  await waitForDecodedFrame(video);
}

async function writeOutput(
  blob: Blob,
  relativePath: string,
  outputDirectory: FileSystemDirectoryHandle | null,
) {
  if (outputDirectory) {
    await writeBlobToDirectory(outputDirectory, relativePath, blob);
  } else {
    downloadBlob(blob, relativePath.split("/").join("_"));
  }
}

function copyCanvas(source: HTMLCanvasElement) {
  const copy = document.createElement("canvas");
  copy.width = source.width;
  copy.height = source.height;
  const ctx = copy.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable.");
  ctx.drawImage(source, 0, 0);
  return copy;
}

function projectFaces(
  renderer: EquirectCubemapRenderer,
  faces: CubeFace[],
  settings: CubemapSettings,
  nearest = false,
) {
  const faceCanvases = new Map<CubeFace, HTMLCanvasElement>();
  for (const face of faces) {
    const faceCanvas = renderer.renderFace(
      face,
      settings.faceSize,
      settings.fovDegrees,
      settings.yawDegrees,
    );
    const copy = copyCanvas(faceCanvas);
    faceCanvases.set(
      face,
      nearest
        ? EquirectCubemapRenderer.thresholdMaskCanvas(copy, settings.faceSize)
        : copy,
    );
  }
  return faceCanvases;
}

async function createVideoFrameProvider(
  file: File,
  settings: CubemapSettings,
  signal?: AbortSignal,
): Promise<FrameProvider> {
  const video = await loadVideo(file, signal);
  const objectUrl = video.src;
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  if (duration <= 0) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Video duration is unavailable.");
  }
  if (!video.videoWidth || !video.videoHeight) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Video dimensions are unavailable.");
  }

  const times = buildVideoSampleTimes(duration, settings);

  return {
    kind: "video",
    frameCount: times.length,
    async drawFrame(index, canvas, ctx) {
      await seekVideo(video, times[index]!);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    },
    dispose() {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    },
  };
}

/**
 * ZIP of stills: each image is one equirect frame (sorted by name).
 * All images are used; the FPS control applies to video inputs only.
 */
async function createZipFrameProvider(
  file: File,
  settings: CubemapSettings,
  signal?: AbortSignal,
  onStatus?: (message: string) => void,
): Promise<FrameProvider> {
  onStatus?.("Reading ZIP archive…");
  const allEntries = await extractImagesFromZip(file, signal);
  const entries = sliceFrameRange(
    allEntries,
    settings.startFrame,
    settings.endFrame,
  );
  if (entries.length === 0) {
    throw new Error("No images remain in the selected frame range.");
  }

  return {
    kind: "images",
    frameCount: entries.length,
    async drawFrame(index, canvas, ctx) {
      const entry = entries[index]!;
      const image = await loadImageBitmapFromBytes(entry.bytes, entry.name);
      try {
        const width =
          "width" in image ? image.width : (image as HTMLImageElement).naturalWidth;
        const height =
          "height" in image ? image.height : (image as HTMLImageElement).naturalHeight;
        if (!width || !height) {
          throw new Error(`Image “${entry.name}” has invalid dimensions.`);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);
      } finally {
        if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
          image.close();
        }
      }
    },
    dispose() {
      // Bytes are GC'd with the closure.
    },
  };
}

export async function processEquirectVideo(options: ProcessVideoOptions) {
  const { file, settings, outputDirectory, signal, onProgress } = options;
  const faces = settings.faces;
  if (faces.length === 0) {
    throw new Error("Select at least one cube face to export.");
  }
  if (settings.exportMasks && settings.maskClasses.length === 0) {
    throw new Error("Select at least one mask class, or disable mask export.");
  }

  const startedAt = performance.now();
  let completedUnits = 0;
  let totalUnits = 0;
  const report = (
    partial: Partial<ProcessProgress> & Pick<ProcessProgress, "phase" | "message">,
  ) => {
    const units = partial.totalUnits ?? totalUnits;
    const done = partial.completedUnits ?? completedUnits;
    const elapsed = performance.now() - startedAt;
    const rate = done > 0 ? elapsed / done : 0;
    const remaining = units > 0 && done > 0 ? Math.max(0, (units - done) * rate) : null;
    onProgress?.({
      phase: partial.phase,
      completedUnits: done,
      totalUnits: units,
      currentFrame: partial.currentFrame ?? 0,
      totalFrames: partial.totalFrames ?? 0,
      currentFace: partial.currentFace ?? null,
      message: partial.message,
      etaMs: remaining,
      percent: units > 0 ? Math.min(100, (done / units) * 100) : 0,
    });
  };

  const inputKind = isZipFile(file)
    ? "zip"
    : isVideoFile(file)
      ? "video"
      : null;
  if (!inputKind) {
    throw new Error(
      "Unsupported input. Choose an equirectangular video (.mp4/.webm/.mov) or a .zip of images.",
    );
  }

  report({
    phase: "preparing",
    message: inputKind === "zip" ? "Loading ZIP frames…" : "Loading video…",
    totalUnits: 0,
    completedUnits: 0,
  });

  const provider =
    inputKind === "zip"
      ? await createZipFrameProvider(file, settings, signal, (message) =>
          report({
            phase: "preparing",
            message,
            totalUnits: 0,
            completedUnits: 0,
          }),
        )
      : await createVideoFrameProvider(file, settings, signal);

  const renderer = new EquirectCubemapRenderer();
  renderer.setProjection(settings.inputProjection);
  const frameCanvas = document.createElement("canvas");
  const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: false });
  if (!frameCtx) {
    renderer.dispose();
    provider.dispose();
    throw new Error("2D canvas unavailable.");
  }

  try {
    throwIfAborted(signal);
    const frameCount = provider.frameCount;
    const colorOutputsPerFrame =
      settings.layout === "separate" ? faces.length : 1;
    const maskMultiplier = settings.exportMasks ? 2 : 1;
    totalUnits = frameCount * colorOutputsPerFrame * maskMultiplier;
    const ext = extensionFor(settings.format);
    const maskExt = "png";
    const jobFolder = `cubemap_${file.name.replace(/\.[^.]+$/, "")}_${Date.now()}`;

    report({
      phase: "extracting",
      message: `Extracting ${frameCount} frame${frameCount === 1 ? "" : "s"}…`,
      totalUnits,
      completedUnits: 0,
      currentFrame: 0,
      totalFrames: frameCount,
    });

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      throwIfAborted(signal);
      await provider.drawFrame(frameIndex, frameCanvas, frameCtx);
      throwIfAborted(signal);

      renderer.uploadEquirect(frameCanvas, frameCanvas.width, frameCanvas.height);

      const faceCanvases = projectFaces(renderer, faces, settings, false);

      let maskFaceCanvases: Map<CubeFace, HTMLCanvasElement> | null = null;
      if (settings.exportMasks) {
        const equirectMask = await buildEquirectExclusionMask(
          frameCanvas,
          settings.maskClasses,
          (message) =>
            report({
              phase: "extracting",
              message: `Frame ${frameIndex + 1}/${frameCount} · ${message}`,
              totalUnits,
              completedUnits,
              currentFrame: frameIndex + 1,
              totalFrames: frameCount,
              currentFace: null,
            }),
        );
        renderer.uploadEquirect(
          equirectMask,
          equirectMask.width,
          equirectMask.height,
          { nearest: true },
        );
        maskFaceCanvases = projectFaces(renderer, faces, settings, true);
      }

      if (settings.layout === "separate") {
        for (const face of faces) {
          throwIfAborted(signal);
          const copy = faceCanvases.get(face)!;
          report({
            phase: "extracting",
            message: `Frame ${frameIndex + 1}/${frameCount} · ${face}`,
            totalUnits,
            completedUnits,
            currentFrame: frameIndex + 1,
            totalFrames: frameCount,
            currentFace: face,
          });

          const blob = await canvasToBlob(copy, settings.format, settings.quality);
          const relativePath = `${jobFolder}/frame_${padFrame(frameIndex + 1, frameCount)}_${face}.${ext}`;
          report({
            phase: "writing",
            message: `Writing ${relativePath}`,
            totalUnits,
            completedUnits,
            currentFrame: frameIndex + 1,
            totalFrames: frameCount,
            currentFace: face,
          });
          await writeOutput(blob, relativePath, outputDirectory);
          completedUnits += 1;
          report({
            phase: "writing",
            message: `Wrote ${relativePath}`,
            totalUnits,
            completedUnits,
            currentFrame: frameIndex + 1,
            totalFrames: frameCount,
            currentFace: face,
          });

          if (maskFaceCanvases) {
            const maskCanvas = maskFaceCanvases.get(face)!;
            const maskBlob = await canvasToBlob(maskCanvas, "png", 1);
            const maskPath = `${jobFolder}/masks/frame_${padFrame(frameIndex + 1, frameCount)}_${face}_mask.${maskExt}`;
            report({
              phase: "writing",
              message: `Writing ${maskPath}`,
              totalUnits,
              completedUnits,
              currentFrame: frameIndex + 1,
              totalFrames: frameCount,
              currentFace: face,
            });
            await writeOutput(maskBlob, maskPath, outputDirectory);
            completedUnits += 1;
            report({
              phase: "writing",
              message: `Wrote ${maskPath}`,
              totalUnits,
              completedUnits,
              currentFrame: frameIndex + 1,
              totalFrames: frameCount,
              currentFace: face,
            });
          }
          await yieldToUi();
        }
      } else {
        throwIfAborted(signal);
        const composed =
          settings.layout === "strip"
            ? composeStrip(faces, faceCanvases, settings.faceSize)
            : composeCross(faces, faceCanvases, settings.faceSize);
        const blob = await canvasToBlob(composed, settings.format, settings.quality);
        const relativePath = `${jobFolder}/frame_${padFrame(frameIndex + 1, frameCount)}_${settings.layout}.${ext}`;
        report({
          phase: "writing",
          message: `Writing ${relativePath}`,
          totalUnits,
          completedUnits,
          currentFrame: frameIndex + 1,
          totalFrames: frameCount,
          currentFace: null,
        });
        await writeOutput(blob, relativePath, outputDirectory);
        completedUnits += 1;
        report({
          phase: "writing",
          message: `Wrote ${relativePath}`,
          totalUnits,
          completedUnits,
          currentFrame: frameIndex + 1,
          totalFrames: frameCount,
          currentFace: null,
        });

        if (maskFaceCanvases) {
          const composedMask =
            settings.layout === "strip"
              ? composeStrip(faces, maskFaceCanvases, settings.faceSize)
              : composeCross(faces, maskFaceCanvases, settings.faceSize);
          const maskBlob = await canvasToBlob(
            thresholdMaskImage(composedMask),
            "png",
            1,
          );
          const maskPath = `${jobFolder}/masks/frame_${padFrame(frameIndex + 1, frameCount)}_${settings.layout}_mask.${maskExt}`;
          report({
            phase: "writing",
            message: `Writing ${maskPath}`,
            totalUnits,
            completedUnits,
            currentFrame: frameIndex + 1,
            totalFrames: frameCount,
            currentFace: null,
          });
          await writeOutput(maskBlob, maskPath, outputDirectory);
          completedUnits += 1;
          report({
            phase: "writing",
            message: `Wrote ${maskPath}`,
            totalUnits,
            completedUnits,
            currentFrame: frameIndex + 1,
            totalFrames: frameCount,
            currentFace: null,
          });
        }
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
      currentFrame: frameCount,
      totalFrames: frameCount,
      currentFace: null,
    });

    return { frames: frameCount, files: completedUnits, folder: jobFolder };
  } finally {
    renderer.dispose();
    provider.dispose();
  }
}

function thresholdMaskImage(source: HTMLCanvasElement) {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable.");
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, out.width, out.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = image.data[i]! >= 127 ? 255 : 0;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return out;
}
