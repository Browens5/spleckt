"use client";

import * as THREE from "three";

/** Deterministic PRNG so textures look identical every visit. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function speckle(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  w: number,
  h: number,
  count: number,
  colors: string[],
  maxSize = 2,
) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.globalAlpha = 0.08 + rand() * 0.22;
    const s = 1 + rand() * maxSize;
    ctx.fillRect(rand() * w, rand() * h, s, s);
  }
  ctx.globalAlpha = 1;
}

export type FacadePalette = {
  wall: string;
  wallShade: string;
  litWarm: string;
  litCool: string;
  dark: string;
};

/** Night office/storefront facade: window grid with mixed lit and dark panes. */
export function makeFacadeTexture(palette: FacadePalette, seed: number) {
  const w = 256;
  const h = 384;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = palette.wall;
  ctx.fillRect(0, 0, w, h);
  speckle(ctx, rand, w, h, 1400, [palette.wallShade, "#000000"], 2);

  const cols = 5;
  const rows = 8;
  const cw = w / cols;
  const ch = h / rows;
  const padX = cw * 0.24;
  const padY = ch * 0.3;

  for (let r = 0; r < rows; r++) {
    // Floor slab line
    ctx.fillStyle = palette.wallShade;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, r * ch - 1, w, 2);
    ctx.globalAlpha = 1;

    for (let c = 0; c < cols; c++) {
      const x = c * cw + padX;
      const y = r * ch + padY;
      const ww = cw - padX * 2;
      const wh = ch - padY * 2;
      const roll = rand();

      if (roll < 0.42) {
        const warm = rand() > 0.35;
        const base = warm ? palette.litWarm : palette.litCool;
        const grad = ctx.createLinearGradient(x, y, x, y + wh);
        grad.addColorStop(0, base);
        grad.addColorStop(1, warm ? "#8a6a3a" : "#3a5a74");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, ww, wh);
        if (rand() > 0.5) {
          // Silhouette blinds
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(x, y, ww, wh * (0.2 + rand() * 0.3));
        }
      } else {
        const grad = ctx.createLinearGradient(x, y, x + ww, y + wh);
        grad.addColorStop(0, palette.dark);
        grad.addColorStop(0.5, "#1c2836");
        grad.addColorStop(1, palette.dark);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, ww, wh);
      }
      // Mullion
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, ww, wh);
    }
  }

  return toTexture(canvas);
}

export function makeAsphaltTexture(seed = 7) {
  const s = 256;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = "#20242b";
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, rand, s, s, 4200, ["#2e343d", "#171a20", "#3a414c"], 2);

  // Faint cracks
  ctx.strokeStyle = "rgba(10,12,16,0.5)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    let x = rand() * s;
    let y = rand() * s;
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (rand() - 0.5) * 60;
      y += rand() * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return toTexture(canvas);
}

export function makeConcreteTexture(seed = 11) {
  const s = 256;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = "#454d58";
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, rand, s, s, 3200, ["#525b68", "#3a414c", "#5d6774"], 2);

  // Panel joints
  ctx.strokeStyle = "rgba(20,24,30,0.6)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo((s / 2) * i, 0);
    ctx.lineTo((s / 2) * i, s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (s / 2) * i);
    ctx.lineTo(s, (s / 2) * i);
    ctx.stroke();
  }

  return toTexture(canvas);
}

export function makeDirtTexture(seed = 21) {
  const s = 256;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = "#5a4028";
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, rand, s, s, 3800, ["#6b4e30", "#47331f", "#7a5c38", "#3a2a18"], 3);

  // Tire tracks
  ctx.strokeStyle = "rgba(40,28,16,0.55)";
  ctx.lineWidth = 7;
  for (let i = 0; i < 3; i++) {
    const y0 = rand() * s;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.bezierCurveTo(s * 0.3, y0 + (rand() - 0.5) * 60, s * 0.7, y0 + (rand() - 0.5) * 60, s, y0 + (rand() - 0.5) * 40);
    ctx.stroke();
  }

  return toTexture(canvas);
}

export function makeGrassTexture(seed = 33) {
  const s = 256;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = "#3d5c36";
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, rand, s, s, 5200, ["#476a3e", "#33502c", "#557a48", "#2a4224"], 2);

  // Mowing stripes
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(0, i * (s / 4), s, s / 8);
  }

  return toTexture(canvas);
}

/** Grayscale horizontal siding — tint via material color. */
export function makeSidingTexture(seed = 41) {
  const s = 128;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = "#c9c9c9";
  ctx.fillRect(0, 0, s, s);
  const rows = 10;
  for (let r = 0; r < rows; r++) {
    const y = (r * s) / rows;
    const grad = ctx.createLinearGradient(0, y, 0, y + s / rows);
    grad.addColorStop(0, "#d8d8d8");
    grad.addColorStop(0.85, "#bcbcbc");
    grad.addColorStop(1, "#8e8e8e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, s, s / rows);
  }
  speckle(ctx, rand, s, s, 700, ["#b0b0b0", "#e0e0e0"], 1.5);

  return toTexture(canvas);
}

/** Grayscale shingles — tint via material color. */
export function makeShingleTexture(seed = 55) {
  const s = 128;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  ctx.fillStyle = "#9a9a9a";
  ctx.fillRect(0, 0, s, s);
  const rows = 6;
  const cols = 6;
  for (let r = 0; r < rows; r++) {
    const y = (r * s) / rows;
    const off = (r % 2) * (s / cols / 2);
    for (let c = -1; c < cols + 1; c++) {
      const x = (c * s) / cols + off;
      const shade = 130 + Math.floor(rand() * 60);
      ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 8})`;
      ctx.fillRect(x + 1, y + 1, s / cols - 2, s / rows - 2);
    }
    ctx.fillStyle = "rgba(40,40,40,0.6)";
    ctx.fillRect(0, y, s, 2);
  }

  return toTexture(canvas);
}

/** Full top-down orthomosaic map: parcels, roads, contours, survey annotations. */
export function makeOrthoMapTexture(seed = 77) {
  const s = 1024;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);

  // Terrain base
  ctx.fillStyle = "#152b31";
  ctx.fillRect(0, 0, s, s);
  speckle(ctx, rand, s, s, 9000, ["#1a343a", "#112227", "#1f3c42"], 3);

  // Parcels
  const parcels = [
    { x: 0.08, y: 0.1, w: 0.32, h: 0.28, c: "#24443c" },
    { x: 0.56, y: 0.14, w: 0.32, h: 0.34, c: "#31402c" },
    { x: 0.1, y: 0.56, w: 0.26, h: 0.3, c: "#274550" },
    { x: 0.52, y: 0.6, w: 0.38, h: 0.26, c: "#3d382a" },
    { x: 0.4, y: 0.34, w: 0.14, h: 0.16, c: "#2b3d33" },
  ];
  for (const p of parcels) {
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x * s, p.y * s, p.w * s, p.h * s);
    speckle(ctx, rand, s, s, 200, ["rgba(255,255,255,0.05)"], 2);
    ctx.strokeStyle = "rgba(79, 208, 232, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(p.x * s, p.y * s, p.w * s, p.h * s);
    ctx.setLineDash([]);
  }

  // Roads
  ctx.fillStyle = "#2c333c";
  ctx.fillRect(s * 0.46, 0, s * 0.07, s);
  ctx.fillRect(0, s * 0.47, s, s * 0.06);
  ctx.strokeStyle = "rgba(220,200,120,0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(s * 0.495, 0);
  ctx.lineTo(s * 0.495, s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.lineTo(s, s * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // Contour lines
  ctx.strokeStyle = "rgba(140,190,200,0.22)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const cx = s * (0.2 + rand() * 0.6);
    const cy = s * (0.2 + rand() * 0.6);
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 30 * k + rand() * 20, 22 * k + rand() * 16, rand(), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Survey annotations
  ctx.font = "600 22px monospace";
  ctx.fillStyle = "rgba(79, 208, 232, 0.85)";
  const notes = [
    ["N 4402.18", 0.1, 0.08],
    ["125.40 m", 0.6, 0.12],
    ["CUT 312 m3", 0.14, 0.52],
    ["FILL 1.2 km3", 0.56, 0.56],
    ["GSD 1.9 cm/px", 0.62, 0.92],
    ["GCP-07", 0.3, 0.4],
    ["GCP-12", 0.74, 0.36],
  ] as const;
  for (const [label, nx, ny] of notes) {
    ctx.fillText(label, nx * s, ny * s);
  }

  // Measurement lines with ticks
  ctx.strokeStyle = "rgba(79, 208, 232, 0.7)";
  ctx.lineWidth = 2;
  const measure = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1 * s, y1 * s);
    ctx.lineTo(x2 * s, y2 * s);
    ctx.stroke();
    for (const [tx, ty] of [
      [x1, y1],
      [x2, y2],
    ]) {
      ctx.beginPath();
      ctx.moveTo(tx * s - 8, ty * s - 8);
      ctx.lineTo(tx * s + 8, ty * s + 8);
      ctx.moveTo(tx * s + 8, ty * s - 8);
      ctx.lineTo(tx * s - 8, ty * s + 8);
      ctx.stroke();
    }
  };
  measure(0.58, 0.18, 0.86, 0.18);
  measure(0.12, 0.62, 0.12, 0.84);

  return toTexture(canvas);
}

/** Radial blur disc for spinning propellers. */
export function makePropDiscTexture() {
  const s = 128;
  const canvas = makeCanvas(s, s);
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(s / 2, s / 2, 6, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "rgba(210,218,228,0.0)");
  grad.addColorStop(0.35, "rgba(210,218,228,0.32)");
  grad.addColorStop(0.85, "rgba(210,218,228,0.16)");
  grad.addColorStop(1, "rgba(210,218,228,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  // Faint blade streaks
  ctx.translate(s / 2, s / 2);
  ctx.fillStyle = "rgba(240,244,250,0.2)";
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.28, s * 0.06, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const FACADE_PALETTES: FacadePalette[] = [
  { wall: "#2a3544", wallShade: "#202a37", litWarm: "#ffd9a0", litCool: "#bfe0ff", dark: "#0e1620" },
  { wall: "#243040", wallShade: "#1b2530", litWarm: "#ffcf8a", litCool: "#a8d4f0", dark: "#0c141d" },
  { wall: "#1f2a36", wallShade: "#171f29", litWarm: "#f5c67e", litCool: "#9cc8e8", dark: "#0a1119" },
  { wall: "#2e3a48", wallShade: "#242e3a", litWarm: "#ffe0b0", litCool: "#c8e4ff", dark: "#101a24" },
];

let facadeCache: THREE.Texture[] | null = null;

export function getFacadeTextures() {
  if (!facadeCache) {
    facadeCache = FACADE_PALETTES.map((p, i) => makeFacadeTexture(p, 100 + i * 37));
  }
  return facadeCache;
}
