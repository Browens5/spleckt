import type { ProcessProgress } from "@/lib/cubemap/types";

function formatEta(ms: number | null) {
  if (ms == null || !Number.isFinite(ms)) return "Estimating…";
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) return `~${totalSeconds}s remaining`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `~${minutes}m ${seconds}s remaining`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `~${hours}h ${remMin}m remaining`;
}

export function ProgressBar({
  progress,
  busy,
}: {
  progress: ProcessProgress;
  busy: boolean;
}) {
  const show =
    busy ||
    progress.phase === "done" ||
    progress.phase === "error" ||
    progress.phase === "cancelled";

  if (!show) {
    return (
      <div className="cm-progress cm-progress--idle" aria-live="polite">
        <div className="cm-progress__track">
          <div className="cm-progress__fill" style={{ width: "0%" }} />
        </div>
        <div className="cm-progress__meta">
          <span>Ready when you are</span>
          <span>On-device only</span>
        </div>
      </div>
    );
  }

  const percent = Math.min(100, Math.max(0, progress.percent));
  const etaLabel =
    progress.phase === "done"
      ? "Finished"
      : progress.phase === "error"
        ? "Stopped"
        : progress.phase === "cancelled"
          ? "Cancelled"
          : formatEta(progress.etaMs);

  return (
    <div
      className={`cm-progress cm-progress--${progress.phase}`}
      role="status"
      aria-live="polite"
      aria-busy={busy}
    >
      <div
        className="cm-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label="Conversion progress"
      >
        <div className="cm-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="cm-progress__meta">
        <span>
          {Math.round(percent)}% · {progress.message}
        </span>
        <span>{etaLabel}</span>
      </div>
      {progress.totalFrames > 0 && progress.phase !== "done" ? (
        <p className="cm-progress__detail">
          Frame {progress.currentFrame}/{progress.totalFrames}
          {progress.currentFace ? ` · ${progress.currentFace}` : ""}
          {progress.totalUnits > 0
            ? ` · ${progress.completedUnits}/${progress.totalUnits} outputs`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
