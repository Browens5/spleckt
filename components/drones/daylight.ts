/** Shared sun state. Updated each frame by SunRig; lights and sky read it. */
export const sunState = {
  /** 0 = night in the city, 1 = bright noon over the neighborhood. */
  factor: 0,
  elev: -0.12,
};
