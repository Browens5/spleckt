/** Four districts along one street. Spacing is tight enough that the next
 *  site is already in frame as you leave the current one. */
export const ANCHOR = {
  downtown: { x: 0, z: 0 },
  construction: { x: 1.5, z: -32 },
  ortho: { x: 0, z: -56 },
  neighborhood: { x: 0, z: -80 },
} as const;

/** What the camera should actually look at (scene visual centers). */
export const FOCUS = {
  downtown: { x: 0, y: 1.35, z: -6 },
  construction: { x: 1.5, y: 2.3, z: -32 },
  ortho: { x: 0, y: 0.15, z: -56 },
  neighborhood: { x: 0, y: 1.15, z: -84 },
} as const;

export const SCAN_WINDOW: [number, number] = [0.5, 0.76];
