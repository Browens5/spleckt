"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const CAM_POINTS = [
  new THREE.Vector3(0, 3.2, 8.5),
  new THREE.Vector3(0.4, 3.4, 2.5),
  new THREE.Vector3(7, 5.2, -7.5),
  new THREE.Vector3(0.5, 14, -10),
  new THREE.Vector3(-2.5, 7.5, -18),
];

const LOOK_POINTS = [
  new THREE.Vector3(0, 1.2, 0),
  new THREE.Vector3(0.2, 1.6, -4),
  new THREE.Vector3(2.5, 2.4, -12),
  new THREE.Vector3(0, 0.2, -12),
  new THREE.Vector3(-1, 1.4, -22),
];

const tmpCam = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const tmpUp = new THREE.Vector3(0, 1, 0);

export function ScrollCamera({
  progress,
  snapToken,
}: {
  progress: MutableRefObject<number>;
  snapToken: MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.2, 0));
  const lastSnap = useRef(0);
  const camCurve = useMemo(() => new THREE.CatmullRomCurve3(CAM_POINTS), []);
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(LOOK_POINTS), []);

  useFrame(() => {
    const t = progress.current;
    camCurve.getPoint(Math.min(0.999, Math.max(0, t)), tmpCam);
    lookCurve.getPoint(Math.min(0.999, Math.max(0, t)), tmpLook);

    if (t > 0.45 && t < 0.72) {
      const ortho = THREE.MathUtils.smoothstep(t, 0.45, 0.62);
      tmpCam.y = THREE.MathUtils.lerp(tmpCam.y, 16, ortho * 0.55);
    }

    const shouldSnap = snapToken.current !== lastSnap.current;
    if (shouldSnap) {
      lastSnap.current = snapToken.current;
      camera.position.copy(tmpCam);
      look.current.copy(tmpLook);
    } else {
      // Adaptive smoothing: track tightly when the target races ahead
      // (fast scrolls) so the camera never cuts corners through geometry.
      const dist = camera.position.distanceTo(tmpCam);
      const alpha = Math.min(1, 0.16 + dist * 0.09);
      camera.position.lerp(tmpCam, alpha);
      look.current.lerp(tmpLook, alpha);
    }

    camera.up.copy(tmpUp);
    camera.lookAt(look.current);
  });

  return null;
}
