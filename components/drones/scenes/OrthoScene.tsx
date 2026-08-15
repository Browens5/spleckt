"use client";

import { useMemo, type MutableRefObject } from "react";
import * as THREE from "three";
import { makeOrthoMapTexture } from "../textures";
import { ScanGrid } from "../effects";
import { ANCHOR, SCAN_WINDOW } from "../layout";

export function OrthoScene({
  progress,
}: {
  progress: MutableRefObject<number>;
}) {
  const orthoMap = useMemo(() => makeOrthoMapTexture(), []);

  const markers = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let x = -7; x <= 7; x += 2) {
      for (let z = -7; z <= 7; z += 2) {
        if ((x + z) % 4 === 0) pts.push([x * 2.0, 0.08, z * 2.0]);
      }
    }
    return pts;
  }, []);

  return (
    <group position={[ANCHOR.ortho.x, 0, ANCHOR.ortho.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial map={orthoMap} roughness={0.95} />
      </mesh>

      <ScanGrid
        size={36}
        color="#4fd0e8"
        position={[0, 0.07, 0]}
        progress={progress}
        window={SCAN_WINDOW}
      />

      {[
        [6, 0.06, -9, 2.0, "#2c463e"],
        [-8, 0.08, 5, 1.6, "#3c3a2c"],
        [10, 0.05, 8, 1.4, "#2a4048"],
        [-5, 0.05, -8, 1.2, "#334438"],
      ].map(([x, y, z, s, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <cylinderGeometry args={[s as number, (s as number) * 1.12, 0.1, 10]} />
          <meshStandardMaterial color={c as string} roughness={0.95} />
        </mesh>
      ))}

      {markers.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <boxGeometry args={[0.38, 0.02, 0.06]} />
            <meshStandardMaterial color="#4fd0e8" emissive="#2a90a0" emissiveIntensity={0.8} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.06, 0.02, 0.38]} />
            <meshStandardMaterial color="#4fd0e8" emissive="#2a90a0" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Two measured stockpiles */}
      {(
        [
          [8, -7],
          [-9, 6],
        ] as const
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <coneGeometry args={[2.1, 1.6, 8]} />
            <meshStandardMaterial color="#8a7060" roughness={1} />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.38, 28]} />
            <meshStandardMaterial
              color="#4fd0e8"
              emissive="#208090"
              emissiveIntensity={0.8}
              side={THREE.DoubleSide}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 3.2, 4]} />
            <meshStandardMaterial
              color="#4fd0e8"
              emissive="#4fd0e8"
              emissiveIntensity={1.2}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      ))}

      {/* Simple structure footprints so the map reads as a real site */}
      <mesh position={[-3, 0.35, -2]}>
        <boxGeometry args={[4.5, 0.7, 3.2]} />
        <meshStandardMaterial color="#4a5858" roughness={0.9} />
      </mesh>
      <mesh position={[4, 0.25, 3]}>
        <boxGeometry args={[3.2, 0.5, 2.6]} />
        <meshStandardMaterial color="#3a4848" roughness={0.9} />
      </mesh>
    </group>
  );
}
