"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePointerLean, useScrollProgress } from "./hooks";
import { SCENES, sceneIndexFromProgress, sceneLocalProgress } from "./themes";

const DronesCanvas = dynamic(
  () => import("./DronesCanvas").then((m) => m.DronesCanvas),
  {
    ssr: false,
    loading: () => <div className="drones-canvas-fallback" aria-hidden />,
  },
);

export function DronesExperience() {
  const scrollT = useScrollProgress();
  const progressRef = useRef(0);
  const snapToken = useRef(0);
  const lean = usePointerLean();
  const sceneIndex = sceneIndexFromProgress(scrollT);
  const scene = SCENES[sceneIndex];
  const local = sceneLocalProgress(scrollT, sceneIndex);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://www.spleckt.com";

  useEffect(() => {
    progressRef.current = scrollT;
  }, [scrollT]);

  const panelOpacity =
    local < 0.12
      ? local / 0.12
      : local > 0.88
        ? (1 - local) / 0.12
        : 1;

  const jumpToScene = (i: number) => {
    const max = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const target = max * ((i + 0.5) * 0.25);
    progressRef.current = Math.min(1, Math.max(0, target / max));
    snapToken.current += 1;
    window.scrollTo({ top: target, behavior: "auto" });
  };

  return (
    <div
      className="drones-experience"
      data-scene={scene.id}
      style={
        {
          "--drones-accent": scene.accent,
          "--drones-overlay": scene.overlayBg,
          "--drones-text": scene.text,
          "--drones-muted": scene.muted,
        } as React.CSSProperties
      }
    >
      <div className="drones-stage" aria-hidden>
        <DronesCanvas
          progress={progressRef}
          lean={lean}
          snapToken={snapToken}
        />
        <div className="drones-vignette" />
        <div className="drones-scan" />
      </div>

      <header className="drones-chrome">
        <Link className="drones-brand" href="/">
          <span className="drones-brand__mark" aria-hidden />
          <span className="drones-brand__name">Spleckt</span>
          <span className="drones-brand__sub">Drones</span>
        </Link>
        <nav className="drones-dots" aria-label="Scenes">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={
                i === sceneIndex
                  ? "drones-dot drones-dot--active"
                  : "drones-dot"
              }
              aria-label={s.label}
              onClick={() => jumpToScene(i)}
            />
          ))}
        </nav>
      </header>

      <div className="drones-scroll" aria-hidden />

      <div className="drones-rail" aria-hidden>
        <div
          className="drones-rail__fill"
          style={{ height: `${Math.round(scrollT * 100)}%` }}
        />
      </div>

      <div
        className="drones-panel"
        style={{ opacity: Math.min(1, Math.max(0, panelOpacity)) }}
      >
        <p className="drones-panel__label">{scene.label}</p>
        <h1 className="drones-panel__title">{scene.title}</h1>
        <p className="drones-panel__body">{scene.body}</p>
        {sceneIndex === 0 ? (
          <p className="drones-panel__hint">Scroll to fly forward</p>
        ) : null}
      </div>

      <footer className="drones-footer">
        <a className="drones-cta" href={appUrl}>
          Explore Spleckt
        </a>
      </footer>
    </div>
  );
}
