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
  const fogA = useRef(new THREE.Color(SCENES[0].fog));
  const fogB = useRef(new THREE.Color(SCENES[0].fog));

  useFrame(() => {
    const t = progress.current;
    const idx = t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3;
    const next = Math.min(3, idx + 1);
    const local = (t - idx * 0.25) / 0.25;
    const blend = Math.max(0, (local - 0.55) / 0.45);

    if (fogRef.current) {
      fogA.current.set(SCENES[idx].fog);
      fogB.current.set(SCENES[next].fog);
      fogRef.current.color.copy(fogA.current).lerp(fogB.current, blend);
      fogRef.current.near = 14;
      fogRef.current.far = 58;
    }
  });

  return (
    <group>
      {/* Continuous ground so gaps never drop to a black void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -52]} receiveShadow>
        <planeGeometry args={[48, 140]} />
        <meshStandardMaterial color="#161c24" roughness={1} />
      </mesh>
      <DowntownScene />
      <ConstructionScene />
      <OrthoScene progress={progress} />
      <NeighborhoodScene density={quality.density} />
    </group>
  );
}
