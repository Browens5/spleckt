/** Four districts along one street, plus a copy of downtown past the
 *  neighborhood so the flight can loop without a visible cut. */
export const LOOP_Z = -128;

export const ANCHOR = {
  downtown: { x: 0, z: 0 },
  construction: { x: 1.5, z: -32 },
  ortho: { x: 0, z: -56 },
  neighborhood: { x: 0, z: -80 },
  downtownLoop: { x: 0, z: LOOP_Z },
} as const;

/** What the camera should actually look at (scene visual centers). */
export const FOCUS = {
  downtown: { x: 0, y: 1.35, z: -6 },
  construction: { x: 1.5, y: 2.3, z: -32 },
  ortho: { x: 0, y: 0.15, z: -56 },
  neighborhood: { x: 0, y: 1.15, z: -84 },
  downtownLoop: { x: 0, y: 1.35, z: LOOP_Z - 6 },
} as const;

export const START_CAM: [number, number, number] = [0, 3.35, 9.2];
export const START_LOOK: [number, number, number] = [
  FOCUS.downtown.x,
  FOCUS.downtown.y,
  FOCUS.downtown.z,
];
export const LOOP_CAM: [number, number, number] = [0, 3.35, LOOP_Z + 9.2];
export const LOOP_LOOK: [number, number, number] = [
  FOCUS.downtownLoop.x,
  FOCUS.downtownLoop.y,
  FOCUS.downtownLoop.z,
];

/** Scroll progress at which we wrap to 0. End pose matches the start. */
export const LOOP_WRAP = 0.996;

export const SCAN_WINDOW: [number, number] = [0.5, 0.76];
