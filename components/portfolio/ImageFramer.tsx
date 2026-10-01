"use client";

import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import {
  CARD_PHOTO,
  type ImageFrame,
  framedImageRect,
} from "@/lib/portfolio/imageFrame";

type FramerProps = {
  src: string;
  frame: ImageFrame;
  onChange: (frame: ImageFrame) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ImageFramer({ src, frame, onChange }: FramerProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [natural, setNatural] = useState({ w: 1, h: 1 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => {
      setSize({ w: stage.clientWidth || 1, h: stage.clientHeight || 1 });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [src]);

  const placed = framedImageRect(natural.w, natural.h, size.w, size.h, frame);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const origin = frame;
    const startX = event.clientX;
    const startY = event.clientY;
    const width = size.w;
    const height = size.h;
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / width;
      const dy = (ev.clientY - startY) / height;
      onChange({
        ...origin,
        x: clamp(origin.x + dx * 2, -1, 1),
        y: clamp(origin.y + dy * 2, -1, 1),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="portfolio-framer">
      <div
        ref={stageRef}
        className="portfolio-framer__stage"
        style={{ aspectRatio: `${CARD_PHOTO.width} / ${CARD_PHOTO.height}` }}
        onPointerDown={onPointerDown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          crossOrigin="anonymous"
          onLoad={(event) => {
            const image = event.currentTarget;
            setNatural({
              w: image.naturalWidth || 1,
              h: image.naturalHeight || 1,
            });
          }}
          style={{
            left: placed.x,
            top: placed.y,
            width: placed.width,
            height: placed.height,
          }}
        />
      </div>
      <div className="portfolio-framer__modes">
        <button
          type="button"
          className={frame.fit === "cover" ? "is-active" : undefined}
          onClick={() => onChange({ ...frame, fit: "cover" })}
        >
          Crop
        </button>
        <button
          type="button"
          className={frame.fit === "contain" ? "is-active" : undefined}
          onClick={() => onChange({ ...frame, fit: "contain" })}
        >
          Fit
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...frame, zoom: 1, x: 0, y: 0 })}
        >
          Reset
        </button>
      </div>
      <label>
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={frame.zoom}
          onChange={(event) =>
            onChange({ ...frame, zoom: Number(event.target.value) })
          }
        />
      </label>
      <p>Drag the photo to reposition it. Crop fills the frame. Fit shows the whole image.</p>
    </div>
  );
}
