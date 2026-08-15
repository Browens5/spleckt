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

/**
 * Visibility windows in scroll progress. Camera snaps on dot jumps, so
 * scenes can hide outside their window without blank frames — this keeps
 * construction props out of the downtown street and vice versa.
 */
const WINDOWS: [number, number][] = [
  [0, 0.3],
  [0.12, 0.58],
  [0.42, 0.83],
  [0.62, 1.01],
];

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
      fogRef.current.near = 5 + t * 5;
      fogRef.current.far = 21 + t * 19;
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
