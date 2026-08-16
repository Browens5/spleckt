"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DowntownScene } from "./DowntownScene";
import { ConstructionScene } from "./ConstructionScene";
import { OrthoScene } from "./OrthoScene";
import { NeighborhoodScene } from "./NeighborhoodScene";
import { Corridor } from "./Corridor";
import { SCENES } from "../themes";
import { sunState } from "../daylight";
import { ANCHOR } from "../layout";
import type { QualityTier } from "../quality";

export function WorldScenes({
  progress,
  quality,
  fogRef,
}: {
  progress: MutableRefObject<number>;
  quality: QualityTier;
  fogRef: MutableRefObject<THREE.Fog | null>;
}) {
  const fogA = useRef(new THREE.Color(SCENES[0].fog));
  const fogB = useRef(new THREE.Color(SCENES[0].fog));

  useFrame(() => {
    const t = progress.current;
    const looping = t >= 0.88;
    const idx = looping ? 3 : t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3;
    const next = looping ? 0 : Math.min(3, idx + 1);
    const local = looping ? (t - 0.88) / 0.12 : (t - idx * 0.25) / 0.25;
    const blend = looping ? Math.min(1, local) : Math.max(0, (local - 0.72) / 0.28);

    if (fogRef.current) {
      fogA.current.set(SCENES[idx].fog);
      fogB.current.set(SCENES[next].fog);
      fogRef.current.color.copy(fogA.current).lerp(fogB.current, blend);
      const day = sunState.factor;
      fogRef.current.near = THREE.MathUtils.lerp(28, 40, day);
      fogRef.current.far = THREE.MathUtils.lerp(110, 160, day);
    }
  });

  return (
    <group>
      <Corridor reducedMotion={quality.reducedMotion} />
      <DowntownScene reducedMotion={quality.reducedMotion} />
      <DowntownScene
        origin={ANCHOR.downtownLoop}
        reducedMotion={quality.reducedMotion}
      />
      <ConstructionScene reducedMotion={quality.reducedMotion} />
      <OrthoScene progress={progress} />
      <NeighborhoodScene density={quality.density} />
    </group>
  );
}
