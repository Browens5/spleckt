"use client";

import { useEffect, useRef, useState } from "react";

type LumaEmbedFrameProps = {
  embedUrl: string;
  title: string;
  posterUrl?: string;
  className?: string;
  /** Delay mount until near viewport to avoid loading two heavy viewers at once. */
  lazy?: boolean;
};

export function LumaEmbedFrame({
  embedUrl,
  title,
  posterUrl,
  className,
  lazy = true,
}: LumaEmbedFrameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(!lazy);

  useEffect(() => {
    if (!lazy || active) return;
    const node = hostRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, lazy]);

  return (
    <div ref={hostRef} className={className ?? "luma-frame"}>
      {active ? (
        <iframe
          title={title}
          src={embedUrl}
          className="luma-frame__iframe"
          allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <div
          className="luma-frame__poster"
          style={
            posterUrl
              ? { backgroundImage: `url(${posterUrl})` }
              : undefined
          }
          aria-hidden
        />
      )}
    </div>
  );
}
