"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DowntownScene } from "./DowntownScene";
import { ConstructionScene } from "./ConstructionScene";
import { OrthoScene } from "./OrthoScene";
import { NeighborhoodScene } from "./NeighborhoodScene";
import { SCENES } from "../themes";
import { WINDOWS } from "../layout";
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
  const downtown = useRef<THREE.Group>(null);
  const construction = useRef<THREE.Group>(null);
  const ortho = useRef<THREE.Group>(null);
  const neighborhood = useRef<THREE.Group>(null);
  const fogA = useRef(new THREE.Color(SCENES[0].fog));
  const fogB = useRef(new THREE.Color(SCENES[0].fog));

  useFrame(() => {
    const t = progress.current;
    const idx = t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3;
    const next = Math.min(3, idx + 1);
    const local = (t - idx * 0.25) / 0.25;
    const blend = Math.max(0, (local - 0.7) / 0.3);

    if (fogRef.current) {
      fogA.current.set(SCENES[idx].fog);
      fogB.current.set(SCENES[next].fog);
      fogRef.current.color.copy(fogA.current).lerp(fogB.current, blend);
      fogRef.current.near = 8 + t * 6;
      fogRef.current.far = 36 + t * 22;
    }

    const groups = [downtown, construction, ortho, neighborhood];
    groups.forEach((g, i) => {
      if (!g.current) return;
      const [start, end] = WINDOWS[i];
      g.current.visible = t >= start && t <= end;
    });
  });

  return (
    <group>
      <group ref={downtown}>
        <DowntownScene />
      </group>
      <group ref={construction}>
        <ConstructionScene />
      </group>
      <group ref={ortho}>
        <OrthoScene progress={progress} />
      </group>
      <group ref={neighborhood}>
        <NeighborhoodScene density={quality.density} />
      </group>
    </group>
  );
}
