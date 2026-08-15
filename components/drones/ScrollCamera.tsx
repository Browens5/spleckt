"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FOCUS } from "./layout";

type Key = {
  t: number;
  cam: [number, number, number];
  look: [number, number, number];
};

const D = FOCUS.downtown;
const C = FOCUS.construction;
const O = FOCUS.ortho;
const N = FOCUS.neighborhood;

/**
 * Hold on each district for its copy window, then fly along the street.
 * Look-ats stay on the visual center so the drone (camera-parented) sits
 * over the scene instead of empty fog.
 */
const KEYS: Key[] = [
  { t: 0, cam: [0, 3.35, 9.2], look: [D.x, D.y, D.z] },
  { t: 0.18, cam: [0.18, 3.55, 1.8], look: [D.x, D.y + 0.08, D.z - 4] },
  { t: 0.26, cam: [3.6, 5.1, C.z + 15], look: [C.x, 2.0, C.z] },
  { t: 0.34, cam: [4.8, 5.4, C.z + 13], look: [C.x, 2.1, C.z] },
  { t: 0.44, cam: [5.0, 5.6, C.z + 12], look: [C.x, 2.2, C.z] },
  { t: 0.5, cam: [2.0, 9.6, O.z + 12], look: [O.x, O.y, O.z] },
  { t: 0.58, cam: [0.55, 12.2, O.z + 5], look: [O.x, O.y, O.z] },
  { t: 0.7, cam: [0.08, 14.2, O.z + 0.3], look: [O.x, 0.04, O.z] },
  { t: 0.76, cam: [-1.1, 6.0, N.z + 14], look: [N.x, 1.1, N.z] },
  { t: 0.88, cam: [-2.2, 5.3, N.z + 10], look: [N.x, 1.05, N.z - 1] },
  { t: 1, cam: [-2.0, 5.1, N.z + 9], look: [N.x, 1.1, N.z - 2] },
];

const tmpCam = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const tmpUp = new THREE.Vector3(0, 1, 0);

function sampleKeys(t: number, cam: THREE.Vector3, look: THREE.Vector3) {
  const x = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < KEYS.length - 2 && x > KEYS[i + 1].t) i += 1;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = THREE.MathUtils.smoothstep(x, a.t, b.t);
  cam.set(
    THREE.MathUtils.lerp(a.cam[0], b.cam[0], u),
    THREE.MathUtils.lerp(a.cam[1], b.cam[1], u),
    THREE.MathUtils.lerp(a.cam[2], b.cam[2], u),
  );
  look.set(
    THREE.MathUtils.lerp(a.look[0], b.look[0], u),
    THREE.MathUtils.lerp(a.look[1], b.look[1], u),
    THREE.MathUtils.lerp(a.look[2], b.look[2], u),
  );
}

export function ScrollCamera({
  progress,
  snapToken,
}: {
  progress: MutableRefObject<number>;
  snapToken: MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(D.x, D.y, D.z));
  const lastSnap = useRef(0);

  useFrame(() => {
    sampleKeys(progress.current, tmpCam, tmpLook);

    const shouldSnap = snapToken.current !== lastSnap.current;
    if (shouldSnap) lastSnap.current = snapToken.current;
    const dist = camera.position.distanceTo(tmpCam);
    // Fast scroll / dot jumps would otherwise lerp through buildings and voids.
    if (shouldSnap || dist > 7) {
      camera.position.copy(tmpCam);
      look.current.copy(tmpLook);
    } else {
      const alpha = Math.min(1, 0.22 + dist * 0.12);
      camera.position.lerp(tmpCam, alpha);
      look.current.lerp(tmpLook, alpha);
    }

    camera.up.copy(tmpUp);
    camera.lookAt(look.current);
  });

  return null;
}
