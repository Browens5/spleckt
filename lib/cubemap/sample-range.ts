import type { CubemapSettings } from "@/lib/cubemap/types";

export type RangeSettings = Pick<
  CubemapSettings,
  "rangeMode" | "startTimeSec" | "endTimeSec" | "startFrame" | "endFrame" | "framesPerSecond"
>;

/**
 * Build sample timestamps for video export, honoring time or frame range.
 * Frame indices are 1-based over the full-video FPS grid (frame 1 = t=0).
 * Time range samples on [start, end) at the chosen FPS, matching the
 * historical full-duration loop of [0, duration).
 */
export function buildVideoSampleTimes(
  duration: number,
  settings: RangeSettings,
): number[] {
  if (!(duration > 0)) {
    throw new Error("Video duration is unavailable.");
  }

  const fps = Math.max(0.05, settings.framesPerSecond);
  const interval = 1 / fps;
  const allTimes: number[] = [];
  for (let t = 0; t < duration - 1e-4; t += interval) {
    allTimes.push(Math.min(t, duration - 1e-4));
  }
  if (allTimes.length === 0) allTimes.push(0);

  if (settings.rangeMode === "frame") {
    const startIdx = Math.max(1, Math.floor(settings.startFrame)) - 1;
    const endIdx =
      settings.endFrame == null
        ? allTimes.length - 1
        : Math.floor(settings.endFrame) - 1;

    if (endIdx < 0) {
      throw new Error("End frame must be at least 1.");
    }
    if (startIdx > endIdx) {
      throw new Error("Start frame must be less than or equal to end frame.");
    }
    if (startIdx >= allTimes.length) {
      throw new Error(
        `Start frame ${startIdx + 1} is past the last sample (${allTimes.length}) at ${fps} FPS.`,
      );
    }

    return allTimes.slice(startIdx, Math.min(endIdx, allTimes.length - 1) + 1);
  }

  const start = Math.max(0, settings.startTimeSec);
  const end =
    settings.endTimeSec == null
      ? duration
      : Math.min(duration, Math.max(0, settings.endTimeSec));

  if (!(end > start)) {
    throw new Error("Start time must be before end time.");
  }

  const times: number[] = [];
  for (let t = start; t < end - 1e-4; t += interval) {
    times.push(Math.min(t, end - 1e-4, duration - 1e-4));
  }
  if (times.length === 0) {
    times.push(Math.min(start, duration - 1e-4));
  }
  return times;
}

/**
 * Slice a ZIP/image frame list by 1-based start/end frame (inclusive).
 * Time mode is ignored for still sequences — frame bounds always apply when set.
 */
export function sliceFrameRange<T>(
  items: T[],
  startFrame: number,
  endFrame: number | null,
): T[] {
  if (items.length === 0) return items;

  const startIdx = Math.max(1, Math.floor(startFrame)) - 1;
  const endIdx =
    endFrame == null ? items.length - 1 : Math.floor(endFrame) - 1;

  if (endIdx < 0) {
    throw new Error("End frame must be at least 1.");
  }
  if (startIdx > endIdx) {
    throw new Error("Start frame must be less than or equal to end frame.");
  }
  if (startIdx >= items.length) {
    throw new Error(
      `Start frame ${startIdx + 1} is past the last image (${items.length}).`,
    );
  }

  return items.slice(startIdx, Math.min(endIdx, items.length - 1) + 1);
}

export function formatDurationLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const frac = seconds - whole;
  const ms = Math.round(frac * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const core =
    h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  if (ms > 0 && seconds < 60) {
    return `${core}.${String(ms).padStart(3, "0")}`;
  }
  return core;
}

/** Max 1-based frame index on the FPS grid for a given duration. */
export function maxSampleFrameCount(duration: number, fps: number) {
  if (!(duration > 0)) return 0;
  const interval = 1 / Math.max(0.05, fps);
  let count = 0;
  for (let t = 0; t < duration - 1e-4; t += interval) count += 1;
  return Math.max(1, count);
}
