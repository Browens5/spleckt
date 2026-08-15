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
    label: "01 · Photo & video",
    title: "Cinema-grade aerials",
    body: "Stills and motion from the air — storefronts, campuses, and city blocks in a single flight.",
    fog: "#163044",
    sky: "#1c3a50",
    accent: "#3ec7c0",
    overlayBg: "rgba(8, 18, 28, 0.55)",
    text: "#e8f4f6",
    muted: "rgba(200, 220, 228, 0.78)",
  },
  {
    id: "construction",
    label: "02 · Progress",
    title: "See the site as it changes",
    body: "Weekly aerials and 3D records so owners, GCs, and trades stay aligned.",
    fog: "#3d2a16",
    sky: "#4a3220",
    accent: "#f0a050",
    overlayBg: "rgba(28, 16, 6, 0.55)",
    text: "#fff3e4",
    muted: "rgba(240, 210, 180, 0.8)",
  },
  {
    id: "ortho",
    label: "03 · Survey",
    title: "Measure from the air",
    body: "Orthomosaics, volumes, and 3D models with survey-grade accuracy.",
    fog: "#123040",
    sky: "#184050",
    accent: "#4fd0e8",
    overlayBg: "rgba(4, 20, 28, 0.58)",
    text: "#e4f7fc",
    muted: "rgba(180, 220, 230, 0.8)",
  },
  {
    id: "neighborhood",
    label: "04 · Tours",
    title: "Walk through, from anywhere",
    body: "Interior and exterior tours that sell homes and document spaces.",
    fog: "#2a3828",
    sky: "#344830",
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
