export type SceneId = "downtown" | "construction" | "ortho" | "neighborhood";

export type SceneTheme = {
  id: SceneId;
  label: string;
  title: string;
  body: string;
  fog: string;
  sky: string;
  accent: string;
  overlayBg: string;
  text: string;
  muted: string;
};

export const SCENES: SceneTheme[] = [
  {
    id: "downtown",
    label: "01 · Capture",
    title: "Aerial photo & video that sells the street",
    body: "Cinematic stills and motion from altitudes that ground cameras cannot reach — storefronts, corridors, and the energy of the city in one pass.",
    fog: "#0b1a28",
    sky: "#132536",
    accent: "#3ec7c0",
    overlayBg: "rgba(8, 18, 28, 0.55)",
    text: "#e8f4f6",
    muted: "rgba(200, 220, 228, 0.78)",
  },
  {
    id: "construction",
    label: "02 · Document",
    title: "Site documentation that drives decisions",
    body: "Comprehensive aerial records and accurate spatial data so teams see progress clearly and act with confidence.",
    fog: "#2a1a0c",
    sky: "#3a2412",
    accent: "#f0a050",
    overlayBg: "rgba(28, 16, 6, 0.55)",
    text: "#fff3e4",
    muted: "rgba(240, 210, 180, 0.8)",
  },
  {
    id: "ortho",
    label: "03 · Measure",
    title: "2D & 3D orthomosaics you can trust",
    body: "Survey-grade mosaics with accurate measurements, volumetrics, and textured 3D models for planning and reporting.",
    fog: "#061820",
    sky: "#0a2430",
    accent: "#4fd0e8",
    overlayBg: "rgba(4, 20, 28, 0.58)",
    text: "#e4f7fc",
    muted: "rgba(180, 220, 230, 0.8)",
  },
  {
    id: "neighborhood",
    label: "04 · Tour",
    title: "Interior & exterior virtual tours",
    body: "Walk the block and the rooms without leaving the browser — immersive tours that connect curb appeal to living space.",
    fog: "#1a2218",
    sky: "#243022",
    accent: "#8fbf6a",
    overlayBg: "rgba(14, 20, 12, 0.55)",
    text: "#eef6e8",
    muted: "rgba(210, 225, 200, 0.8)",
  },
];

export function sceneIndexFromProgress(t: number) {
  if (t < 0.25) return 0;
  if (t < 0.5) return 1;
  if (t < 0.75) return 2;
  return 3;
}

export function sceneLocalProgress(t: number, index: number) {
  const start = index * 0.25;
  const end = start + 0.25;
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}
