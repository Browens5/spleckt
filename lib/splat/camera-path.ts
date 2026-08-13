import * as THREE from "three";
import type { HomeExperienceSettings } from "@/lib/home-experience";

export type CameraBeat = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
};

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Orbit around world origin (0,0,0). The capture is translated so the admin
 * center sits at the origin — animation and scroll share that pivot.
 */
export function sampleOrbitCamera(
  settings: HomeExperienceSettings["scroll"],
  progress: number,
): CameraBeat {
  const t = easeInOut(Math.min(1, Math.max(0, progress)));
  const yawDeg = THREE.MathUtils.lerp(settings.yawStart, settings.yawEnd, t);
  const yaw = THREE.MathUtils.degToRad(yawDeg);
  const radius = Math.max(1, settings.radius);

  return {
    position: new THREE.Vector3(
      Math.sin(yaw) * radius,
      settings.height,
      Math.cos(yaw) * radius,
    ),
    target: new THREE.Vector3(0, settings.lookHeight, 0),
    fov: settings.fov,
  };
}

/** Spark OpenCV→Three rotation used on SOG meshes (`quaternion.set(1,0,0,0)`). */
export const SOG_ORIENTATION = new THREE.Quaternion(1, 0, 0, 0);

/** Place a SuperSplat-space point at world origin after SOG orientation. */
export function meshOffsetForCenter(center: {
  x: number;
  y: number;
  z: number;
}): THREE.Vector3 {
  return new THREE.Vector3(center.x, center.y, center.z)
    .applyQuaternion(SOG_ORIENTATION)
    .negate();
}
