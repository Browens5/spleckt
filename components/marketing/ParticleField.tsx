"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
};

type ParticleFieldProps = {
  className?: string;
  density?: number;
};

/**
 * Soft gaussian-like particle field — depth layers, pointer swirl, gentle drift.
 */
export function ParticleField({
  className,
  density = 1,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let particles: Particle[] = [];
    const pointer = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45, active: false };
    let time = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(
        Math.min(220, Math.max(70, (width * height) / 14000)) * density,
      );
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const spawn = (randomLife = false): Particle => {
      const z = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: (Math.random() - 0.5) * (0.15 + z * 0.45),
        vy: (Math.random() - 0.5) * (0.12 + z * 0.35) - 0.04 * z,
        life: randomLife ? Math.random() : 0,
        maxLife: 4 + Math.random() * 8,
        size: 0.6 + z * 3.8 + Math.random() * 1.2,
        hue: Math.random() > 0.72 ? 38 : Math.random() > 0.4 ? 168 : 190,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / Math.max(rect.width, 1);
      pointer.ty = (event.clientY - rect.top) / Math.max(rect.height, 1);
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const draw = (dt: number) => {
      time += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // Soft atmospheric wash that keeps particles readable over bright scenes
      const wash = ctx.createRadialGradient(
        width * 0.72,
        height * 0.28,
        0,
        width * 0.55,
        height * 0.45,
        Math.max(width, height) * 0.85,
      );
      wash.addColorStop(0, "rgba(215, 235, 231, 0.04)");
      wash.addColorStop(0.45, "rgba(196, 165, 116, 0.02)");
      wash.addColorStop(1, "rgba(10, 24, 32, 0.06)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      const px = pointer.x * width;
      const py = pointer.y * height;

      // Sort back-to-front for depth
      particles.sort((a, b) => a.z - b.z);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += dt;

        const swirl = 0.00035 + p.z * 0.00055;
        const ox = p.x - px;
        const oy = p.y - py;
        const dist = Math.hypot(ox, oy) + 1;
        const force = pointer.active
          ? Math.min(18, 2800 / (dist * dist))
          : Math.min(4, 900 / (dist * dist));

        p.vx += (-oy * swirl + (ox / dist) * force * 0.015) * dt * 60;
        p.vy += (ox * swirl + (oy / dist) * force * 0.015) * dt * 60;
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.x += p.vx * (0.55 + p.z) * 60 * dt;
        p.y += p.vy * (0.55 + p.z) * 60 * dt;
        p.y += Math.sin(time * 0.35 + i * 0.17) * 0.015 * p.z;

        if (
          p.life > p.maxLife ||
          p.x < -40 ||
          p.x > width + 40 ||
          p.y < -40 ||
          p.y > height + 40
        ) {
          particles[i] = spawn();
          continue;
        }

        const fadeIn = Math.min(1, p.life * 1.4);
        const fadeOut = Math.min(1, (p.maxLife - p.life) * 0.7);
        const alpha = fadeIn * fadeOut * (0.18 + p.z * 0.55);
        const r = p.size * (0.7 + p.z * 0.9);

        // Soft gaussian kernel
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
        g.addColorStop(
          0,
          `hsla(${p.hue}, 48%, ${58 + p.z * 22}%, ${alpha * 0.95})`,
        );
        g.addColorStop(
          0.35,
          `hsla(${p.hue}, 42%, ${50 + p.z * 18}%, ${alpha * 0.35})`,
        );
        g.addColorStop(1, `hsla(${p.hue}, 40%, 50%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, r * 0.22), 0, Math.PI * 2);
        ctx.fill();
      }

      // Occasional connective filaments near the pointer
      if (pointer.active) {
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          if (a.z < 0.45) continue;
          const da = Math.hypot(a.x - px, a.y - py);
          if (da > 140) continue;
          for (let j = i + 1; j < Math.min(particles.length, i + 18); j++) {
            const b = particles[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d > 70) continue;
            const lineAlpha = (1 - d / 70) * 0.12 * a.z;
            ctx.strokeStyle = `rgba(215, 235, 231, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduceMotion) draw(dt);
      else {
        // Static sparse field for reduced motion
        if (time === 0) {
          time = 1;
          draw(0);
        }
      }
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "particle-field"}
      aria-hidden
    />
  );
}
