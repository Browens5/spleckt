/** Canvas-painted textures for the groovy games lounge. */

export const GROOVE = {
  cream: "#f3e3c2",
  sand: "#e8cf9e",
  rust: "#c96a2e",
  orange: "#e8923a",
  gold: "#e7b53c",
  olive: "#7c7a33",
  plum: "#6d3d70",
  magenta: "#c74e79",
  teal: "#2e7f76",
  brown: "#5b3a24",
  espresso: "#33210f",
};

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return { canvas, ctx };
}

/** Warm wood plank floor. */
export function paintFloor() {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = "#7a4b28";
  ctx.fillRect(0, 0, 512, 512);
  const plankH = 64;
  for (let y = 0; y < 512; y += plankH) {
    const shade = 0.85 + ((y / plankH) % 3) * 0.07;
    ctx.fillStyle = `rgba(58, 33, 15, ${0.35 - shade * 0.2})`;
    ctx.fillRect(0, y, 512, plankH);
    ctx.fillStyle = "rgba(40, 22, 10, 0.55)";
    ctx.fillRect(0, y, 512, 3);
    const offset = ((y / plankH) % 2) * 256;
    ctx.fillRect((offset + 128) % 512, y, 3, plankH);
    // grain
    ctx.strokeStyle = "rgba(50, 28, 12, 0.25)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i += 1) {
      const gy = y + 10 + i * 11;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(140, gy + 4, 320, gy - 4, 512, gy + 2);
      ctx.stroke();
    }
  }
  return canvas;
}

/** Concentric groovy ring rug. */
export function paintRug() {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rings = [
    GROOVE.rust,
    GROOVE.orange,
    GROOVE.gold,
    GROOVE.cream,
    GROOVE.plum,
    GROOVE.magenta,
    GROOVE.orange,
    GROOVE.gold,
    GROOVE.rust,
    GROOVE.cream,
  ];
  ctx.clearRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;
  const max = 252;
  for (let i = rings.length - 1; i >= 0; i -= 1) {
    const radius = (max * (i + 1)) / rings.length;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = rings[i];
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, max * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = GROOVE.espresso;
  ctx.fill();
  return canvas;
}

/** Warm paneled wall with a sunburst mural. */
export function paintWall(width: number, height: number, sunburst: boolean) {
  const { canvas, ctx } = makeCanvas(width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#e9d5ae");
  sky.addColorStop(1, "#d9b97f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (sunburst) {
    const cx = width * 0.5;
    const cy = height * 0.94;
    const rays = 26;
    for (let i = 0; i < rays; i += 1) {
      const a0 = Math.PI + (i / rays) * Math.PI;
      const a1 = Math.PI + ((i + 0.55) / rays) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, Math.max(width, height), a0, a1);
      ctx.closePath();
      ctx.fillStyle =
        i % 2 === 0 ? "rgba(201, 106, 46, 0.20)" : "rgba(231, 181, 60, 0.16)";
      ctx.fill();
    }
  }

  // wainscoting panels
  const panelTop = height * 0.62;
  ctx.fillStyle = "#8a5630";
  ctx.fillRect(0, panelTop, width, height - panelTop);
  ctx.fillStyle = "rgba(51, 33, 15, 0.5)";
  ctx.fillRect(0, panelTop, width, 6);
  const panelW = width / 8;
  for (let i = 0; i < 8; i += 1) {
    ctx.strokeStyle = "rgba(51, 33, 15, 0.45)";
    ctx.lineWidth = 4;
    ctx.strokeRect(i * panelW + 10, panelTop + 16, panelW - 20, height - panelTop - 30);
  }
  return canvas;
}

/** Retro circle poster art. */
export function paintPoster(variant: number) {
  const { canvas, ctx } = makeCanvas(256, 320);
  const palettes = [
    [GROOVE.plum, GROOVE.magenta, GROOVE.orange, GROOVE.cream],
    [GROOVE.teal, GROOVE.gold, GROOVE.rust, GROOVE.cream],
    [GROOVE.rust, GROOVE.orange, GROOVE.gold, GROOVE.cream],
  ];
  const palette = palettes[variant % palettes.length];
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = GROOVE.cream;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 310);

  if (variant % 3 === 0) {
    // overlapping circles
    const spots: [number, number, number][] = [
      [80, 90, 62],
      [176, 120, 52],
      [110, 210, 70],
      [200, 240, 40],
    ];
    spots.forEach(([x, y, radius], index) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = palette[1 + (index % 3)];
      ctx.fill();
    });
  } else if (variant % 3 === 1) {
    // wavy stripes
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 30 + i * 44);
      ctx.bezierCurveTo(80, i * 44, 176, 90 + i * 44, 256, 40 + i * 44);
      ctx.lineTo(256, 88 + i * 44);
      ctx.bezierCurveTo(176, 134 + i * 44, 80, 44 + i * 44, 0, 74 + i * 44);
      ctx.closePath();
      ctx.fillStyle = palette[1 + (i % 3)];
      ctx.fill();
    }
  } else {
    // rainbow arch
    const arcs = [palette[1], palette[2], palette[3], palette[1], palette[2]];
    arcs.forEach((color, index) => {
      ctx.beginPath();
      ctx.arc(128, 260, 150 - index * 26, Math.PI, 0);
      ctx.lineWidth = 22;
      ctx.strokeStyle = color;
      ctx.stroke();
    });
  }
  return canvas;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Glowing marquee sign. */
export function paintMarquee(lines: string[], accent = GROOVE.orange) {
  const { canvas, ctx } = makeCanvas(1024, 320);
  ctx.clearRect(0, 0, 1024, 320);
  roundedRect(ctx, 8, 8, 1008, 304, 44);
  ctx.fillStyle = "rgba(24, 12, 6, 0.92)";
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = accent;
  ctx.stroke();
  roundedRect(ctx, 26, 26, 972, 268, 34);
  ctx.lineWidth = 4;
  ctx.strokeStyle = GROOVE.gold;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineHeight = 268 / lines.length;
  lines.forEach((line, index) => {
    const y = 26 + lineHeight * (index + 0.5);
    const size = index === 0 ? Math.min(118, lineHeight * 0.74) : lineHeight * 0.52;
    ctx.font = `700 ${size}px 'Righteous', 'Trebuchet MS', sans-serif`;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 26;
    ctx.fillStyle = index === 0 ? GROOVE.cream : GROOVE.gold;
    ctx.fillText(line, 512, y);
    ctx.shadowBlur = 0;
  });
  return canvas;
}

/** Standing sign for the front desk or a table. */
export function paintStandingSign(title: string, subtitle: string, accent: string) {
  const { canvas, ctx } = makeCanvas(512, 320);
  ctx.clearRect(0, 0, 512, 320);
  roundedRect(ctx, 6, 6, 500, 308, 36);
  ctx.fillStyle = "rgba(30, 16, 8, 0.94)";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = accent;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 84px 'Righteous', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = GROOVE.cream;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.fillText(title, 256, 118);
  ctx.shadowBlur = 0;
  ctx.font = "600 46px 'Trebuchet MS', sans-serif";
  ctx.fillStyle = accent;
  ctx.fillText(subtitle, 256, 226);
  return canvas;
}

/** Checkers board face texture (squares are separate meshes; this is trim). */
export function paintBoardTrim() {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = GROOVE.espresso;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = GROOVE.gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 240, 240);
  return canvas;
}
