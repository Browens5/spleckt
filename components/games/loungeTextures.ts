/**
 * Canvas-painted textures for the groovy games lounge.
 * Psychedelic 70s palette: purple walls, orange shag, neon accents.
 * All textures are small (≤512px) to keep GPU memory low on mobile.
 */

export const GROOVE = {
  cream: "#f6e7c8",
  gold: "#ffc63a",
  orange: "#ff8c2f",
  rust: "#d96a1f",
  magenta: "#e84393",
  pink: "#ff7ab8",
  green: "#7ed957",
  teal: "#2fbfa7",
  blue: "#5aa7ff",
  purple: "#3a1c52",
  purpleDeep: "#241033",
  plum: "#6d3d70",
  brown: "#5b3a24",
  espresso: "#2c1810",
};

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return { canvas, ctx };
}

/** Deterministic pseudo-random for repeatable textures. */
function makeRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

/** Orange shag carpet with tonal strokes and a soft green swirl accent. */
export function paintFloor() {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rand = makeRandom(42);
  ctx.fillStyle = GROOVE.rust;
  ctx.fillRect(0, 0, 512, 512);

  // shag texture: lots of short strokes in nearby orange shades
  const shades = ["#e5741f", "#c85e17", "#f08a33", "#b95513", "#ff9c3f"];
  for (let i = 0; i < 2600; i += 1) {
    const x = rand() * 512;
    const y = rand() * 512;
    const angle = rand() * Math.PI * 2;
    const length = 3 + rand() * 6;
    ctx.strokeStyle = shades[Math.floor(rand() * shades.length)];
    ctx.globalAlpha = 0.5 + rand() * 0.5;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // groovy green swirl accent in one corner (like the reference rug pattern)
  ctx.strokeStyle = "rgba(126, 217, 87, 0.5)";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.beginPath();
    ctx.arc(90, 420, 28 + ring * 34, Math.PI * 0.2, Math.PI * 1.4);
    ctx.stroke();
  }
  return canvas;
}

/** Concentric groovy ring rug. */
export function paintRug() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const rings = [
    GROOVE.magenta,
    GROOVE.orange,
    GROOVE.gold,
    GROOVE.green,
    GROOVE.teal,
    GROOVE.gold,
    GROOVE.orange,
    GROOVE.magenta,
  ];
  ctx.clearRect(0, 0, 256, 256);
  const max = 126;
  for (let i = rings.length - 1; i >= 0; i -= 1) {
    ctx.beginPath();
    ctx.arc(128, 128, (max * (i + 1)) / rings.length, 0, Math.PI * 2);
    ctx.fillStyle = rings[i];
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(128, 128, max * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = GROOVE.purpleDeep;
  ctx.fill();
  return canvas;
}

/** Deep purple wall with psychedelic swirl doodles. */
export function paintWall(width: number, height: number, seed: number) {
  const { canvas, ctx } = makeCanvas(width, height);
  const rand = makeRandom(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#472363");
  sky.addColorStop(1, GROOVE.purple);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // wavy swirl tendrils in darker/lighter purple
  ctx.lineCap = "round";
  for (let i = 0; i < 16; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const radius = 20 + rand() * 42;
    const turns = 2 + rand() * 1.5;
    ctx.strokeStyle = rand() > 0.5 ? "rgba(36, 16, 51, 0.5)" : "rgba(130, 80, 170, 0.35)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let a = 0; a <= turns * Math.PI * 2; a += 0.25) {
      const r = (radius * a) / (turns * Math.PI * 2);
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r * 0.85;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // baseboard
  ctx.fillStyle = GROOVE.espresso;
  ctx.fillRect(0, height - 14, width, 14);
  return canvas;
}

/** Retro poster art in the psychedelic palette. */
export function paintPoster(variant: number) {
  const { canvas, ctx } = makeCanvas(192, 240);
  const bg = [GROOVE.plum, GROOVE.purpleDeep, GROOVE.rust, "#1a1024"][variant % 4];
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 192, 240);
  ctx.strokeStyle = GROOVE.cream;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 184, 232);

  if (variant % 4 === 0) {
    // smiling sunburst
    const cx = 96;
    const cy = 110;
    ctx.fillStyle = GROOVE.gold;
    for (let i = 0; i < 16; i += 1) {
      const a0 = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 86, a0, a0 + 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fillStyle = GROOVE.orange;
    ctx.fill();
    ctx.fillStyle = GROOVE.espresso;
    ctx.beginPath();
    ctx.arc(cx - 18, cy - 12, 6, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy - 12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + 8, 28, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = GROOVE.espresso;
    ctx.stroke();
  } else if (variant % 4 === 1) {
    // hypno spiral rings
    const colors = [GROOVE.magenta, GROOVE.gold, GROOVE.teal, GROOVE.orange];
    for (let i = 9; i >= 0; i -= 1) {
      ctx.beginPath();
      ctx.arc(96, 120, 10 + i * 10, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    }
  } else if (variant % 4 === 2) {
    // rainbow arch
    const arcs = [GROOVE.magenta, GROOVE.orange, GROOVE.gold, GROOVE.green, GROOVE.blue];
    arcs.forEach((color, index) => {
      ctx.beginPath();
      ctx.arc(96, 200, 120 - index * 20, Math.PI, 0);
      ctx.lineWidth = 16;
      ctx.strokeStyle = color;
      ctx.stroke();
    });
  } else {
    // black cat
    ctx.fillStyle = "#161018";
    ctx.beginPath();
    ctx.ellipse(96, 150, 52, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(50, 112);
    ctx.lineTo(58, 58);
    ctx.lineTo(82, 108);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(142, 112);
    ctx.lineTo(134, 58);
    ctx.lineTo(110, 108);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = GROOVE.gold;
    ctx.beginPath();
    ctx.arc(78, 138, 7, 0, Math.PI * 2);
    ctx.arc(114, 138, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GROOVE.magenta;
    ctx.beginPath();
    ctx.moveTo(96, 152);
    ctx.lineTo(88, 164);
    ctx.lineTo(104, 164);
    ctx.closePath();
    ctx.fill();
  }
  return canvas;
}

/** Glowing neon sign on a transparent background. */
export function paintNeonSign(text: string, color: string, big = false) {
  const width = 512;
  const height = big ? 192 : 128;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // shrink the font until the text fits with margin for the glow
  let size = big ? 96 : 68;
  do {
    ctx.font = `700 ${size}px 'Righteous', 'Trebuchet MS', sans-serif`;
    if (ctx.measureText(text).width <= width - 60) break;
    size -= 4;
  } while (size > 24);
  // layered glow
  ctx.shadowColor = color;
  for (const blur of [34, 18]) {
    ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.fillText(text, width / 2, height / 2);
  }
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, width / 2, height / 2);
  ctx.shadowBlur = 0;
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

/** Standing sign for the front desk or a table. */
export function paintStandingSign(title: string, subtitle: string, accent: string) {
  const { canvas, ctx } = makeCanvas(512, 320);
  ctx.clearRect(0, 0, 512, 320);
  roundedRect(ctx, 6, 6, 500, 308, 36);
  ctx.fillStyle = "rgba(26, 12, 38, 0.94)";
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

/** Checkers board rim. */
export function paintBoardTrim() {
  const { canvas, ctx } = makeCanvas(128, 128);
  ctx.fillStyle = GROOVE.espresso;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = GROOVE.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 120, 120);
  return canvas;
}

/** Chunky-pixel arcade screen. */
export function paintArcadeScreen(variant: number) {
  const { canvas, ctx } = makeCanvas(128, 128);
  const rand = makeRandom(7 + variant * 13);
  ctx.fillStyle = "#0a0518";
  ctx.fillRect(0, 0, 128, 128);
  const palette =
    variant % 2 === 0
      ? [GROOVE.green, GROOVE.cream, GROOVE.magenta]
      : [GROOVE.gold, GROOVE.blue, GROOVE.pink];
  // rows of invader-ish blocks
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      if (rand() < 0.3) continue;
      ctx.fillStyle = palette[row % palette.length];
      ctx.fillRect(14 + col * 18, 18 + row * 16, 12, 10);
    }
  }
  // player + score bar
  ctx.fillStyle = GROOVE.cream;
  ctx.fillRect(56, 108, 16, 8);
  ctx.fillStyle = palette[0];
  ctx.fillRect(10, 6, 40, 5);
  return canvas;
}

/** Label for a vinyl record. */
export function paintVinyl() {
  const { canvas, ctx } = makeCanvas(128, 128);
  ctx.fillStyle = "#1a1210";
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let r = 18; r < 60; r += 5) {
    ctx.beginPath();
    ctx.arc(64, 64, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = GROOVE.orange;
  ctx.beginPath();
  ctx.arc(64, 64, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GROOVE.espresso;
  ctx.beginPath();
  ctx.arc(64, 64, 4, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}
