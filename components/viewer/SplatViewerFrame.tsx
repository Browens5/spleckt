"use client";

type SplatViewerFrameProps = {
  contentUrl: string;
  settingsUrl?: string;
  posterUrl?: string | null;
  title?: string;
  className?: string;
};

export function SplatViewerFrame({
  contentUrl,
  settingsUrl,
  posterUrl,
  title = "3D capture viewer",
  className,
}: SplatViewerFrameProps) {
  const params = new URLSearchParams({
    content: contentUrl,
  });
  if (settingsUrl) params.set("settings", settingsUrl);
  if (posterUrl) params.set("poster", posterUrl);

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
