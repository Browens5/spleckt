import { cpSync, mkdirSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(
  root,
  "node_modules",
  "@playcanvas",
  "supersplat-viewer",
  "public",
);
const target = path.join(root, "public", "viewer");

if (!existsSync(source)) {
  console.warn("supersplat-viewer not installed; skipping viewer copy");
  process.exit(0);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

const settingsPath = path.join(target, "settings.json");
if (!existsSync(settingsPath)) {
  writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        version: 2,
        tonemapping: "linear",
        highPrecisionRendering: false,
        background: { color: [0.96, 0.97, 0.98] },
        postEffectSettings: {
          sharpness: { enabled: false, amount: 0 },
          bloom: { enabled: false, intensity: 0.1, blurLevel: 2 },
          grading: {
            enabled: false,
            brightness: 1,
            contrast: 1,
            saturation: 1,
            tint: [1, 1, 1],
          },
          vignette: {
            enabled: false,
            intensity: 0.5,
            inner: 0.3,
            outer: 0.75,
            curvature: 1,
          },
          fringing: { enabled: false, intensity: 0.5 },
        },
        cameras: [
          {
            initial: {
              position: [0, 1, -1],
              target: [0, 0, 0],
              fov: 75,
            },
          },
        ],
        animTracks: [],
        annotations: [],
        startMode: "default",
      },
      null,
      2,
    ),
  );
}

console.log("Copied SuperSplat viewer assets to public/viewer");
