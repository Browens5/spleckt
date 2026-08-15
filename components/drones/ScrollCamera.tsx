"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ANCHOR } from "./layout";

const CAM_POINTS = [
  new THREE.Vector3(0, 3.4, 12),
  new THREE.Vector3(0.3, 3.6, -6),
  new THREE.Vector3(1, 4.2, -28),
  new THREE.Vector3(8, 6.4, ANCHOR.construction.z + 6),
  new THREE.Vector3(0.4, 18, ANCHOR.ortho.z + 2),
  new THREE.Vector3(-5, 9.2, ANCHOR.neighborhood.z + 14),
];

const LOOK_POINTS = [
  new THREE.Vector3(0, 1.2, 2),
  new THREE.Vector3(0, 1.4, -14),
  new THREE.Vector3(0, 1.8, -40),
  new THREE.Vector3(ANCHOR.construction.x, 2.4, ANCHOR.construction.z),
  new THREE.Vector3(ANCHOR.ortho.x, 0.2, ANCHOR.ortho.z),
  new THREE.Vector3(ANCHOR.neighborhood.x, 1.2, ANCHOR.neighborhood.z - 4),
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
  const look = useRef(new THREE.Vector3(0, 1.2, 2));
  const lastSnap = useRef(0);
  const camCurve = useMemo(() => new THREE.CatmullRomCurve3(CAM_POINTS), []);
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(LOOK_POINTS), []);

  useFrame(() => {
    const t = progress.current;
    camCurve.getPoint(Math.min(0.999, Math.max(0, t)), tmpCam);
    lookCurve.getPoint(Math.min(0.999, Math.max(0, t)), tmpLook);

    if (t > 0.48 && t < 0.76) {
      const ortho = THREE.MathUtils.smoothstep(t, 0.5, 0.64);
      tmpCam.y = THREE.MathUtils.lerp(tmpCam.y, 20, ortho * 0.55);
    }

    const shouldSnap = snapToken.current !== lastSnap.current;
    if (shouldSnap) {
      lastSnap.current = snapToken.current;
      camera.position.copy(tmpCam);
      look.current.copy(tmpLook);
    } else {
      const dist = camera.position.distanceTo(tmpCam);
      const alpha = Math.min(1, 0.16 + dist * 0.08);
      camera.position.lerp(tmpCam, alpha);
      look.current.lerp(tmpLook, alpha);
    }

    camera.up.copy(tmpUp);
    camera.lookAt(look.current);
  });

  return null;
}
