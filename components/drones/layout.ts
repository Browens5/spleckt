/** World-space anchors and scroll windows. Scenes sit far enough apart
 *  that they never occupy the same volume; the camera flies the gaps. */
export const ANCHOR = {
  downtown: { x: 0, z: 0 },
  construction: { x: 2, z: -54 },
  ortho: { x: 0, z: -96 },
  neighborhood: { x: 0, z: -142 },
} as const;

/** Inclusive scroll-progress windows. Slight overlap only for fog blend. */
export const WINDOWS: [number, number][] = [
  [0, 0.3],
  [0.22, 0.56],
  [0.48, 0.8],
  [0.72, 1.01],
];

export const SCAN_WINDOW: [number, number] = [0.5, 0.78];
