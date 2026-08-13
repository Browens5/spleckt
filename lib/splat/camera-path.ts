import * as THREE from "three";

export type CameraBeat = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
};

/**
 * SuperSplat stores cameras in the same world frame Spark gets after
 * `mesh.quaternion.set(1, 0, 0, 0)` (OpenCV → Three). Use values as-is.
 */
function beat(
  px: number,
  py: number,
  pz: number,
  tx: number,
  ty: number,
  tz: number,
  fov: number,
): CameraBeat {
  return {
    position: new THREE.Vector3(px, py, pz),
    target: new THREE.Vector3(tx, ty, tz),
    fov,
  };
}

/** Short cinematic path through the Weitz HQ capture (from SuperSplat settings). */
export const WEITZ_CAMERA_PATH: CameraBeat[] = [
  // Exterior establishing — settings "initial"
  beat(
    -294.0,
    75.24,
    234.84,
    -285.58,
    23.05,
    118.43,
    62,
  ),
  // Sweep along the facade
  beat(
    -180.84,
    86.99,
    273.47,
    -291.78,
    22.82,
    264.11,
    58,
  ),
  // Approach the entrance volume
  beat(
    -114.45,
    52.34,
    -122.72,
    -75.57,
    35.98,
    -159.67,
    64,
  ),
  // Closer courtyard / plaza read
  beat(-20.25, 45.15, -66.94, -8.26, 18.34, -35.2, 55),
];

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function sampleCameraPath(
  path: CameraBeat[],
  progress: number,
): CameraBeat {
  const p = Math.min(1, Math.max(0, progress));
  if (path.length === 1) return path[0];

  const scaled = p * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(scaled));
  const local = easeInOut(scaled - i);
  const a = path[i];
  const b = path[i + 1];

  return {
    position: a.position.clone().lerp(b.position, local),
    target: a.target.clone().lerp(b.target, local),
    fov: THREE.MathUtils.lerp(a.fov, b.fov, local),
  };
}
