"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ANCHOR } from "./layout";

type Key = {
  t: number;
  cam: [number, number, number];
  look: [number, number, number];
};

/** Poses keyed to scroll so each copy window frames its own site. */
const KEYS: Key[] = [
  { t: 0, cam: [0, 3.25, 9], look: [0, 1.15, -5] },
  { t: 0.12, cam: [0.15, 3.45, -3], look: [0, 1.25, -16] },
  { t: 0.22, cam: [0.6, 4.1, -18], look: [1.2, 1.8, ANCHOR.construction.z + 10] },
  {
    t: 0.32,
    cam: [8.8, 6.8, ANCHOR.construction.z + 16],
    look: [ANCHOR.construction.x, 2.2, ANCHOR.construction.z],
  },
  {
    t: 0.42,
    cam: [9.2, 7.2, ANCHOR.construction.z + 5],
    look: [ANCHOR.construction.x, 2.4, ANCHOR.construction.z],
  },
  {
    t: 0.52,
    cam: [3.2, 11.5, ANCHOR.ortho.z + 14],
    look: [ANCHOR.ortho.x, 0.3, ANCHOR.ortho.z],
  },
  {
    t: 0.62,
    cam: [0.15, 16.5, ANCHOR.ortho.z + 0.5],
    look: [ANCHOR.ortho.x, 0.05, ANCHOR.ortho.z],
  },
  {
    t: 0.74,
    cam: [-2.4, 10.5, ANCHOR.neighborhood.z + 20],
    look: [ANCHOR.neighborhood.x, 1.1, ANCHOR.neighborhood.z],
  },
  {
    t: 0.88,
    cam: [-5.2, 8.4, ANCHOR.neighborhood.z + 12],
    look: [0, 1.15, ANCHOR.neighborhood.z - 2],
  },
  {
    t: 1,
    cam: [-4.6, 8.1, ANCHOR.neighborhood.z + 10],
    look: [0, 1.2, ANCHOR.neighborhood.z - 3],
  },
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
  const look = useRef(new THREE.Vector3(0, 1.15, -5));
  const lastSnap = useRef(0);

  useFrame(() => {
    sampleKeys(progress.current, tmpCam, tmpLook);

    const shouldSnap = snapToken.current !== lastSnap.current;
    if (shouldSnap) {
      lastSnap.current = snapToken.current;
      camera.position.copy(tmpCam);
      look.current.copy(tmpLook);
    } else {
      const dist = camera.position.distanceTo(tmpCam);
      const alpha = Math.min(1, 0.2 + dist * 0.1);
      camera.position.lerp(tmpCam, alpha);
      look.current.lerp(tmpLook, alpha);
    }

    camera.up.copy(tmpUp);
    camera.lookAt(look.current);
  });

  return null;
}
