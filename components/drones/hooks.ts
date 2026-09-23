"use client";

import { useEffect, useRef, useState } from "react";
import { LOOP_WRAP } from "./layout";

export function useScrollProgress(scrollHeightFactor = 4.5) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const update = () => {
      raf.current = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      let t = Math.min(1, Math.max(0, window.scrollY / max));
      // Seamless loop: end camera pose matches the opening shot, so
      // resetting scroll to 0 is invisible.
      if (t >= LOOP_WRAP) {
        window.scrollTo({ top: 0, behavior: "auto" });
        t = 0;
      }
      setProgress(t);
    };

    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [scrollHeightFactor]);

  return progress;
}

export function usePointerLean() {
  const lean = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      lean.current.tx = nx;
      lean.current.ty = ny;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return lean;
}
