export const CUBE_FACES = [
  "front",
  "right",
  "back",
  "left",
  "top",
  "bottom",
] as const;

export type CubeFace = (typeof CUBE_FACES)[number];

export type OutputLayout = "separate" | "strip" | "cross";

export type ImageFormat = "png" | "jpeg" | "webp";

export const MASK_CLASSES = ["people", "cars", "sky"] as const;

export type MaskClass = (typeof MASK_CLASSES)[number];

export type CubemapSettings = {
  /** Frames to extract per second of video. */
  framesPerSecond: number;
  /** Output resolution for each cube face (pixels). */
  faceSize: number;
  /** Horizontal/vertical FOV for each face, in degrees (90 = classic cubemap). */
  fovDegrees: number;
  /** Which faces to generate. */
  faces: CubeFace[];
  /** Include top and bottom faces when toggling the convenience switch. */
  includeTopBottom: boolean;
  /** How faces are packed into output files. */
  layout: OutputLayout;
  /** Image codec for written frames. */
  format: ImageFormat;
  /** JPEG/WebP quality 0–1. */
  quality: number;
  /** Optional yaw offset applied to the panorama before projection (degrees). */
  yawDegrees: number;
  /** When true, also export photogrammetry masks for selected classes. */
  exportMasks: boolean;
  /** Classes to paint black (excluded) in mask exports. */
  maskClasses: MaskClass[];
};

export type ProcessProgress = {
  phase: "idle" | "preparing" | "extracting" | "writing" | "done" | "error" | "cancelled";
  completedUnits: number;
  totalUnits: number;
  currentFrame: number;
  totalFrames: number;
  currentFace: CubeFace | null;
  message: string;
  /** Estimated milliseconds remaining, null until enough samples. */
  etaMs: number | null;
  percent: number;
};

export const DEFAULT_CUBEMAP_SETTINGS: CubemapSettings = {
  framesPerSecond: 1,
  faceSize: 1024,
  fovDegrees: 90,
  faces: ["front", "right", "back", "left", "top", "bottom"],
  includeTopBottom: true,
  layout: "separate",
  format: "png",
  quality: 0.92,
  yawDegrees: 0,
  exportMasks: false,
  maskClasses: ["people", "cars", "sky"],
};

export function facesFromPreferences(
  includeTopBottom: boolean,
  selected: CubeFace[],
): CubeFace[] {
  const sideOrder: CubeFace[] = ["front", "right", "back", "left"];
  const vertical: CubeFace[] = includeTopBottom ? ["top", "bottom"] : [];
  const allowed = new Set<CubeFace>([...sideOrder, ...vertical]);
  return CUBE_FACES.filter((face) => selected.includes(face) && allowed.has(face));
}
