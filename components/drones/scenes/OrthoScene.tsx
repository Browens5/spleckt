"use client";

import { useMemo, type MutableRefObject } from "react";
import * as THREE from "three";
import { makeOrthoMapTexture } from "../textures";
import { ScanGrid } from "../effects";

export function OrthoScene({
  progress,
}: {
  progress: MutableRefObject<number>;
}) {
  const orthoMap = useMemo(() => makeOrthoMapTexture(), []);

  const markers = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let x = -5; x <= 5; x += 2) {
      for (let z = -5; z <= 5; z += 2) {
        if ((x + z) % 4 === 0) pts.push([x * 1.8, 0.08, z * 1.8]);
      }
    }
    return pts;
  }, []);

  return (
    <group position={[0, 0, -12]}>
      {/* Orthomosaic base — procedurally drawn survey map */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial map={orthoMap} roughness={0.95} />
      </mesh>

      {/* Animated survey scan overlay — only during the ortho segment */}
      <ScanGrid
        size={26}
        color="#4fd0e8"
        position={[0, 0.07, 0]}
        progress={progress}
      />

      {/* Low terraced elevation pads — subtle relief that doesn't bury the map */}
      {[
        [4, 0.05, -7, 1.6, "#2c463e"],
        [-6.5, 0.07, 3.5, 1.3, "#3c3a2c"],
        [7.5, 0.04, 6.5, 1.1, "#2a4048"],
      ].map(([x, y, z, s, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <cylinderGeometry args={[s as number, (s as number) * 1.12, 0.1, 10]} />
          <meshStandardMaterial color={c as string} roughness={0.95} />
        </mesh>
      ))}

      {/* Ground control point crosses */}
      {markers.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <boxGeometry args={[0.35, 0.02, 0.06]} />
            <meshStandardMaterial color="#4fd0e8" emissive="#2a90a0" emissiveIntensity={0.8} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.06, 0.02, 0.35]} />
            <meshStandardMaterial color="#4fd0e8" emissive="#2a90a0" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Stockpile with measured volume ring */}
      <mesh position={[6, 0.6, -5]} castShadow>
        <coneGeometry args={[1.8, 1.4, 8]} />
        <meshStandardMaterial color="#8a7060" roughness={1} />
      </mesh>
      <mesh position={[6, 0.05, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.05, 28]} />
        <meshStandardMaterial
          color="#4fd0e8"
          emissive="#208090"
          emissiveIntensity={0.8}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Vertical measurement beam on the pile */}
      <mesh position={[6, 1.5, -5]}>
        <cylinderGeometry args={[0.012, 0.012, 3, 4]} />
        <meshStandardMaterial
          color="#4fd0e8"
          emissive="#4fd0e8"
          emissiveIntensity={1.2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
