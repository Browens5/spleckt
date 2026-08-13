export type ShowcaseScene = {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  sourceUrl: string;
  author: string;
  authorUrl?: string;
  license?: string;
  licenseUrl?: string;
  kind: "supersplat" | "luma";
  /** SuperSplat / local viewer content */
  contentUrl?: string;
  settingsUrl?: string;
  heroSettingsUrl?: string;
  /** Luma embeddable viewer */
  embedUrl?: string;
};

/** Public SuperSplat showcase used on the marketing home page. */
export const WEITZ_SHOWCASE: ShowcaseScene = {
  id: "c0568a51",
  title: "The Weitz Company — Des Moines, IA",
  description:
    "Interactive tour of The Weitz Company headquarters in downtown Des Moines.",
  contentUrl: "https://d28zzqy0iyovbz.cloudfront.net/c0568a51/v1/meta.json",
  posterUrl:
    "https://s3-eu-west-1.amazonaws.com/images.playcanvas.com/splat/c0568a51/v1/xl.webp",
  settingsUrl: "/showcase/weitz-settings.json",
  heroSettingsUrl: "/showcase/weitz-hero-settings.json",
  sourceUrl: "https://superspl.at/scene/c0568a51",
  author: "weitzvdc",
  authorUrl: "https://superspl.at/user/weitzvdc",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  kind: "supersplat",
};

/** Luma AI capture — Gilbert Regional Park (owner capture). */
export const GILBERT_SHOWCASE: ShowcaseScene = {
  id: "d8e40529-3710-4b73-8840-f8412f623f83",
  title: "Gilbert Regional Park",
  description:
    "An outdoor park capture — walk paths, trees, and open space in lifelike 3D.",
  posterUrl:
    "https://cdn-luma.com/1dbe6e5368792a3d66bba6090b6f3461f19017d5e68a6a9a279366170734a566/GilbertRegional_thumb.jpg",
  embedUrl:
    "https://lumalabs.ai/embed/d8e40529-3710-4b73-8840-f8412f623f83",
  sourceUrl:
    "https://lumalabs.ai/capture/d8e40529-3710-4b73-8840-f8412f623f83",
  author: "browens5",
  kind: "luma",
};

export const SHOWCASE_SCENES: ShowcaseScene[] = [
  WEITZ_SHOWCASE,
  GILBERT_SHOWCASE,
];

export function viewerHrefFor(scene: ShowcaseScene): string {
  if (scene.kind === "luma" && scene.embedUrl) {
    return scene.sourceUrl;
  }
  if (!scene.contentUrl) return scene.sourceUrl;
  const params = new URLSearchParams({
    content: scene.contentUrl,
    title: scene.title,
  });
  if (scene.posterUrl) params.set("poster", scene.posterUrl);
  if (scene.settingsUrl) params.set("settings", scene.settingsUrl);
  return `/viewer?${params.toString()}`;
}
