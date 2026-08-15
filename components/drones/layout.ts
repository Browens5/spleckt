/** Scene centers along one corridor. Gaps are short enough that the next
 *  site is already in fog as you leave the current one. */
export const ANCHOR = {
  downtown: { x: 0, z: 0 },
  construction: { x: 1.5, z: -38 },
  ortho: { x: 0, z: -70 },
  neighborhood: { x: 0, z: -102 },
} as const;

export const SCAN_WINDOW: [number, number] = [0.5, 0.76];
