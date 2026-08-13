"use client";

type SplatViewerFrameProps = {
  contentUrl: string;
  settingsUrl?: string;
  posterUrl?: string | null;
  title?: string;
  className?: string;
  /** Hide viewer chrome for embedded marketing surfaces. */
  noui?: boolean;
  /** Disable camera animation tracks. */
  noanim?: boolean;
  /** Prefer WebGL when WebGPU is unavailable or undesired. */
  webgl?: boolean;
};

export function SplatViewerFrame({
  contentUrl,
  settingsUrl,
  posterUrl,
  title = "3D capture viewer",
  className,
  noui = false,
  noanim = false,
  webgl = false,
}: SplatViewerFrameProps) {
  const params = new URLSearchParams({
    content: contentUrl,
  });
  if (settingsUrl) params.set("settings", settingsUrl);
  if (posterUrl) params.set("poster", posterUrl);
  if (noui) params.set("noui", "1");
  if (noanim) params.set("noanim", "1");
  if (webgl) params.set("webgl", "1");

  return (
    <iframe
      title={title}
      src={`/viewer/index.html?${params.toString()}`}
      className={className ?? "splat-frame"}
      allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"
      allowFullScreen
    />
  );
}
