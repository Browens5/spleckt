export type QualityTier = {
  dprMax: number;
  shadows: boolean;
  shadowMapSize: number;
  density: "low" | "medium" | "high";
  propDetail: boolean;
  reducedMotion: boolean;
};

export function detectQuality(): QualityTier {
  if (typeof window === "undefined") {
    return {
      dprMax: 1.5,
      shadows: true,
      shadowMapSize: 1024,
      density: "medium",
      propDetail: true,
      reducedMotion: false,
    };
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency || 4;
  const memory =
    "deviceMemory" in navigator
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
      : 4;

  const low = coarse || narrow || cores <= 4 || memory <= 4;

  if (reducedMotion) {
    return {
      dprMax: 1,
      shadows: false,
      shadowMapSize: 512,
      density: "low",
      propDetail: false,
      reducedMotion: true,
    };
  }

  if (low) {
    return {
      dprMax: 1.25,
      shadows: false,
      shadowMapSize: 512,
      density: "low",
      propDetail: false,
      reducedMotion: false,
    };
  }

  return {
    dprMax: Math.min(2, window.devicePixelRatio || 1.5),
    shadows: true,
    shadowMapSize: 1024,
    density: "high",
    propDetail: true,
    reducedMotion: false,
  };
}
