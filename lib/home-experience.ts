import { z } from "zod";

export type Vec3 = { x: number; y: number; z: number };

export type HomeExperienceSettings = {
  /** SuperSplat-space point that is mapped to world origin (0,0,0). */
  center: Vec3;
  scroll: {
    /** Camera distance from origin on XZ. */
    radius: number;
    /** Camera height (Y). */
    height: number;
    /** Look-at Y offset from origin. */
    lookHeight: number;
    /** Orbit yaw at scroll 0, degrees. */
    yawStart: number;
    /** Orbit yaw at scroll 1, degrees. */
    yawEnd: number;
    fov: number;
  };
  /** Radius of the origin particle cloud used while loading / assembling. */
  assembleRadius: number;
};

/** Weitz plaza look-at — a readable aerial of HQ once mapped to origin. */
export const DEFAULT_HOME_EXPERIENCE: HomeExperienceSettings = {
  center: { x: -285.58, y: 23.05, z: 118.43 },
  scroll: {
    radius: 128,
    height: 52,
    lookHeight: 4,
    yawStart: -8,
    yawEnd: 48,
    fov: 58,
  },
    assembleRadius: 36,
};

const vec3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export const homeExperienceSchema = z.object({
  center: vec3Schema,
  scroll: z.object({
    radius: z.number().finite().min(1).max(2000),
    height: z.number().finite().min(-500).max(2000),
    lookHeight: z.number().finite().min(-200).max(500),
    yawStart: z.number().finite().min(-720).max(720),
    yawEnd: z.number().finite().min(-720).max(720),
    fov: z.number().finite().min(20).max(120),
  }),
  assembleRadius: z.number().finite().min(0.5).max(400),
});

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function parseHomeExperience(input: unknown): HomeExperienceSettings {
  if (!input || typeof input !== "object") return { ...DEFAULT_HOME_EXPERIENCE };
  const raw = input as Record<string, unknown>;
  const center =
    raw.center && typeof raw.center === "object"
      ? (raw.center as Record<string, unknown>)
      : {};
  const scroll =
    raw.scroll && typeof raw.scroll === "object"
      ? (raw.scroll as Record<string, unknown>)
      : {};
  const d = DEFAULT_HOME_EXPERIENCE;
  return {
    center: {
      x: num(center.x, d.center.x),
      y: num(center.y, d.center.y),
      z: num(center.z, d.center.z),
    },
    scroll: {
      radius: num(scroll.radius, d.scroll.radius),
      height: num(scroll.height, d.scroll.height),
      lookHeight: num(scroll.lookHeight, d.scroll.lookHeight),
      yawStart: num(scroll.yawStart, d.scroll.yawStart),
      yawEnd: num(scroll.yawEnd, d.scroll.yawEnd),
      fov: num(scroll.fov, d.scroll.fov),
    },
    assembleRadius: num(raw.assembleRadius, d.assembleRadius),
  };
}
