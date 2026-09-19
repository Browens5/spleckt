import type { PortfolioProject } from "@/lib/portfolio/types";

export const CARD_TEXTURE = { width: 768, height: 1152 };
export const PLAY_BUTTON = { cx: 768 - 118, cy: 1152 - 118, radius: 44 };

const WIDTH = CARD_TEXTURE.width;
const HEIGHT = CARD_TEXTURE.height;
const CYAN = "#3ce7ff";

export function uvHitsPlayButton(u: number, v: number) {
  const x = u * WIDTH;
  const y = v * HEIGHT;
  return Math.hypot(x - PLAY_BUTTON.cx, y - PLAY_BUTTON.cy) <= PLAY_BUTTON.radius;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  lines.forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight);
  });
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function paintProcedural(
  ctx: CanvasRenderingContext2D,
  project: PortfolioProject,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const seed = hashString(`${project.id}:${project.title}`);
  const theme =
    project.id === "pp_docks" || project.id === "pp_splats"
      ? 0
      : project.id === "pp_fleet" || project.id === "pp_rising"
        ? 1
        : project.id === "pp_field"
          ? 3
          : seed % 5;

  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, "#02060d");
  sky.addColorStop(0.4, "#041525");
  sky.addColorStop(1, "#01040a");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  if (theme === 0) {
    const cx = x + w * 0.5;
    const cy = y + h * 0.42;
    for (let i = 8; i >= 1; i -= 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, 28 + i * 28, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80, 230, 255, ${0.08 + i * 0.04})`;
      ctx.lineWidth = i === 3 ? 8 : 2;
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 90);
    glow.addColorStop(0, "rgba(180, 250, 255, 0.95)");
    glow.addColorStop(0.35, "rgba(40, 200, 255, 0.45)");
    glow.addColorStop(1, "rgba(10, 40, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === 1) {
    const cx = x + w * 0.72;
    const cy = y + h * 0.28;
    const planet = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, 120);
    planet.addColorStop(0, "#d7f7ff");
    planet.addColorStop(0.45, "#3aa0c8");
    planet.addColorStop(1, "#071018");
    ctx.fillStyle = planet;
    ctx.beginPath();
    ctx.arc(cx, cy, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(140, 230, 255, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 150, 28, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 40; i += 1) {
      const px = x + ((seed + i * 97) % w);
      const py = y + ((seed / (i + 3)) % h);
      ctx.fillStyle = `rgba(200, 240, 255, ${0.2 + (i % 5) * 0.12})`;
      ctx.fillRect(px, py, 2, 2);
    }
  } else if (theme === 2) {
    ctx.strokeStyle = "rgba(120, 80, 255, 0.85)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) {
      const sx = x + w * 0.5 + Math.sin(i) * 40;
      const sy = y + 20;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      let px = sx;
      let py = sy;
      for (let k = 0; k < 8; k += 1) {
        px += ((i * 13 + k * 29 + seed) % 80) - 40;
        py += 40 + ((i + k) % 30);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    const bloom = ctx.createRadialGradient(
      x + w / 2,
      y + h * 0.45,
      10,
      x + w / 2,
      y + h * 0.45,
      180,
    );
    bloom.addColorStop(0, "rgba(180, 90, 255, 0.55)");
    bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(x, y, w, h);
  } else if (theme === 3) {
    for (let i = 0; i < 16; i += 1) {
      const bx = x + 20 + ((i * 47 + seed) % (w - 80));
      const bh = 40 + ((i * 31 + seed) % (h * 0.55));
      ctx.fillStyle = `rgba(20, 8, 40, ${0.4 + (i % 4) * 0.1})`;
      ctx.fillRect(bx, y + h - bh - 20, 28 + (i % 3) * 10, bh);
      ctx.fillStyle = i % 2 === 0 ? "rgba(255, 60, 180, 0.55)" : "rgba(60, 220, 255, 0.55)";
      for (let wy = 0; wy < bh - 16; wy += 14) {
        ctx.fillRect(bx + 6, y + h - bh + wy, 4, 6);
        ctx.fillRect(bx + 16, y + h - bh + wy, 4, 6);
      }
    }
    ctx.fillStyle = "rgba(255, 70, 170, 0.18)";
    ctx.fillRect(x, y + h * 0.62, w, 8);
  } else {
    ctx.strokeStyle = "rgba(40, 180, 255, 0.25)";
    ctx.lineWidth = 1;
    for (let gx = x; gx < x + w; gx += 28) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y; gy < y + h; gy += 28) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(80, 230, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const px = x + 40 + i * ((w - 80) / 5);
      const py = y + h * 0.3 + Math.sin(i + seed) * 80;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const fade = ctx.createLinearGradient(x, y + h * 0.45, x, y + h);
  fade.addColorStop(0, "rgba(3, 10, 18, 0)");
  fade.addColorStop(1, "rgba(3, 10, 18, 0.92)");
  ctx.fillStyle = fade;
  ctx.fillRect(x, y, w, h);
}

function drawCorners(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  size: number,
) {
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x + w - size, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + size);
  ctx.moveTo(x + w, y + h - size);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - size, y + h);
  ctx.moveTo(x + size, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - size);
  ctx.stroke();
}

export async function paintProjectCard(
  project: PortfolioProject,
  displayIndex: number,
  highlighted: boolean,
) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  await document.fonts.ready.catch(() => undefined);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  roundRect(ctx, 18, 18, WIDTH - 36, HEIGHT - 36, 36);
  ctx.fillStyle = highlighted ? "rgba(6, 18, 28, 0.96)" : "rgba(4, 12, 20, 0.94)";
  ctx.fill();
  ctx.save();
  roundRect(ctx, 18, 18, WIDTH - 36, HEIGHT - 36, 36);
  ctx.clip();

  const imageTop = 86;
  const imageHeight = 560;
  const image = project.imageUrl ? await loadImage(project.imageUrl) : null;
  if (image) {
    const scale = Math.max(
      (WIDTH - 36) / image.width,
      imageHeight / image.height,
    );
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.drawImage(
      image,
      18 + (WIDTH - 36 - dw) / 2,
      imageTop + (imageHeight - dh) / 2,
      dw,
      dh,
    );
    const fade = ctx.createLinearGradient(0, imageTop + imageHeight * 0.55, 0, imageTop + imageHeight);
    fade.addColorStop(0, "rgba(4, 12, 20, 0)");
    fade.addColorStop(1, "rgba(4, 12, 20, 0.92)");
    ctx.fillStyle = fade;
    ctx.fillRect(18, imageTop, WIDTH - 36, imageHeight);
  } else {
    paintProcedural(ctx, project, 18, imageTop, WIDTH - 36, imageHeight);
  }

  ctx.fillStyle = "rgba(2, 8, 14, 0.94)";
  ctx.fillRect(18, imageTop + imageHeight - 8, WIDTH - 36, HEIGHT - (imageTop + imageHeight) - 10);

  ctx.restore();

  ctx.shadowColor = highlighted ? "rgba(60, 231, 255, 0.85)" : "rgba(60, 231, 255, 0.4)";
  ctx.shadowBlur = highlighted ? 28 : 14;
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = highlighted ? 6 : 4;
  roundRect(ctx, 18, 18, WIDTH - 36, HEIGHT - 36, 36);
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawCorners(ctx, 34, 34, WIDTH - 68, HEIGHT - 68, 28);

  ctx.fillStyle = CYAN;
  ctx.font = "600 28px Orbitron, Rajdhani, sans-serif";
  ctx.fillText(String(displayIndex).padStart(2, "0"), 56, 72);

  ctx.fillStyle = "#f4fbff";
  ctx.font = "700 42px Orbitron, Rajdhani, sans-serif";
  wrapText(ctx, project.title.toUpperCase(), 56, 720, WIDTH - 200, 48, 2);

  const meta = [project.category, project.year].filter(Boolean).join("  ·  ");
  ctx.fillStyle = CYAN;
  ctx.font = "600 22px Rajdhani, sans-serif";
  ctx.fillText(meta.toUpperCase(), 56, 820);

  ctx.fillStyle = "rgba(214, 236, 246, 0.82)";
  ctx.font = "500 24px Rajdhani, sans-serif";
  wrapText(ctx, project.description || "Add a description for this project.", 56, 870, WIDTH - 180, 32, 4);

  const bx = PLAY_BUTTON.cx;
  const by = PLAY_BUTTON.cy;
  const hasLink = Boolean(project.linkUrl);
  ctx.beginPath();
  ctx.arc(bx, by, 30, 0, Math.PI * 2);
  ctx.fillStyle = hasLink ? "rgba(60, 231, 255, 0.18)" : "rgba(60, 231, 255, 0.06)";
  ctx.fill();
  ctx.shadowColor = hasLink ? "rgba(60, 231, 255, 0.7)" : "rgba(60, 231, 255, 0.2)";
  ctx.shadowBlur = hasLink ? 16 : 0;
  ctx.strokeStyle = hasLink ? CYAN : "rgba(60, 231, 255, 0.45)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = hasLink ? CYAN : "rgba(60, 231, 255, 0.45)";
  ctx.beginPath();
  ctx.moveTo(bx - 6, by - 12);
  ctx.lineTo(bx + 14, by);
  ctx.lineTo(bx - 6, by + 12);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

export function paintDeckTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 6;

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
  const fill = ctx.createRadialGradient(cx, cy, 16, cx, cy, maxR);
  fill.addColorStop(0, "#0a1822");
  fill.addColorStop(0.5, "#071018");
  fill.addColorStop(1, "#04080c");
  ctx.fillStyle = fill;
  ctx.fill();

  const rings = [0.18, 0.34, 0.52, 0.7, 0.86, 0.98];
  rings.forEach((t, index) => {
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * t, 0, Math.PI * 2);
    ctx.strokeStyle =
      index === rings.length - 1 || index === 3
        ? "rgba(60, 231, 255, 0.95)"
        : "rgba(60, 231, 255, 0.48)";
    ctx.lineWidth = index === rings.length - 1 ? 8 : index === 3 ? 6 : 3;
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(60, 231, 255, 0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * maxR * 0.12, cy + Math.sin(a) * maxR * 0.12);
    ctx.lineTo(cx + Math.cos(a) * maxR * 0.86, cy + Math.sin(a) * maxR * 0.86);
    ctx.stroke();
  }

  for (let i = 0; i < 64; i += 1) {
    const a = (i / 64) * Math.PI * 2;
    const major = i % 4 === 0;
    const inner = maxR * (major ? 0.9 : 0.94);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
    ctx.strokeStyle = major ? "rgba(60, 231, 255, 0.82)" : "rgba(60, 231, 255, 0.35)";
    ctx.lineWidth = major ? 3 : 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.08, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(60, 231, 255, 0.75)";
  ctx.lineWidth = 3;
  ctx.stroke();

  return canvas;
}

export function paintGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#03070c";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.strokeStyle = "rgba(60, 231, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 1024; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(60, 231, 255, 0.32)";
  for (let i = 0; i <= 1024; i += 256) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }
  return canvas;
}
