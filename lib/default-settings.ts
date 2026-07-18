export const defaultExperienceSettings = {
  version: 2 as const,
  tonemapping: "linear" as const,
  highPrecisionRendering: false,
  background: {
    color: [0.96, 0.97, 0.98] as [number, number, number],
  },
  postEffectSettings: {
    sharpness: { enabled: false, amount: 0 },
    bloom: { enabled: false, intensity: 0.1, blurLevel: 2 },
    grading: {
      enabled: false,
      brightness: 1,
      contrast: 1,
      saturation: 1,
      tint: [1, 1, 1] as [number, number, number],
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
        position: [0, 1, -1] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
        fov: 75,
      },
    },
  ],
  animTracks: [],
  annotations: [],
  startMode: "default" as const,
};
