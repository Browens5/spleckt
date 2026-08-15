"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DowntownScene } from "./DowntownScene";
import { ConstructionScene } from "./ConstructionScene";
import { OrthoScene } from "./OrthoScene";
import { NeighborhoodScene } from "./NeighborhoodScene";
import { SCENES } from "../themes";
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
    const blend = Math.max(0, (local - 0.65) / 0.35);

    if (fogRef.current) {
      fogA.current.set(SCENES[idx].fog);
      fogB.current.set(SCENES[next].fog);
      fogRef.current.color.copy(fogA.current).lerp(fogB.current, blend);
      fogRef.current.near = 6 + t * 4;
      fogRef.current.far = 28 + t * 12;
    }

    const groups = [downtown, construction, ortho, neighborhood];
    groups.forEach((g, i) => {
      if (!g.current) return;
      const center = 0.08 + i * 0.25;
      const dist = Math.abs(t - center);
      g.current.visible = dist < 0.38;
      const s = THREE.MathUtils.clamp(1 - dist * 0.35, 0.85, 1);
      g.current.scale.setScalar(s);
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
        <OrthoScene />
      </group>
      <group ref={neighborhood}>
        <NeighborhoodScene density={quality.density} />
      </group>
    </group>
  );
}
