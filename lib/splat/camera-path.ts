import * as THREE from "three";

export type CameraBeat = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
};

/** PlayCanvas/OpenCV → Three.js after mesh quaternion (1,0,0,0) YZ flip. */
export function flipCvToThree(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, -y, -z);
}

/** Short cinematic path through the Weitz outdoor capture. */
export const WEITZ_CAMERA_PATH: CameraBeat[] = [
  {
    position: flipCvToThree(-214.87, 76.29, 129.79),
    target: flipCvToThree(-289.52, 30.52, 260.67),
    fov: 62,
  },
  {
    position: flipCvToThree(-180.84, 86.99, 273.47),
    target: flipCvToThree(-291.78, 22.82, 264.11),
    fov: 58,
  },
  {
    position: flipCvToThree(-114.45, 52.34, -122.72),
    target: flipCvToThree(-75.57, 35.98, -159.67),
    fov: 64,
  },
  {
    position: flipCvToThree(-20.25, 45.15, -66.94),
    target: flipCvToThree(-8.26, 18.34, -35.2),
    fov: 55,
  },
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
