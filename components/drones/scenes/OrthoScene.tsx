"use client";

import { useMemo } from "react";
import * as THREE from "three";

function Lot({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number];
  color: string;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

export function OrthoScene() {
  const gridLines = useMemo(() => {
    const lines: { pos: [number, number, number]; size: [number, number] }[] = [];
    for (let i = -6; i <= 6; i++) {
      lines.push({ pos: [i * 2.2, 0.04, 0], size: [0.04, 28] });
      lines.push({ pos: [0, 0.04, i * 2.2], size: [28, 0.04] });
    }
    return lines;
  }, []);

  const markers = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let x = -5; x <= 5; x += 2) {
      for (let z = -5; z <= 5; z += 2) {
        if ((x + z) % 4 === 0) pts.push([x * 1.8, 0.08, z * 1.8 - 12]);
      }
    }
    return pts;
  }, []);

  return (
    <group position={[0, 0, -12]}>
      {/* Base site */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a3038" roughness={1} />
      </mesh>

      <Lot position={[-4, 0.02, -2]} size={[6, 5]} color="#2a4a40" />
      <Lot position={[4, 0.02, 1]} size={[5.5, 6]} color="#3a4830" />
      <Lot position={[0, 0.02, 5]} size={[8, 4]} color="#4a4030" />
      <Lot position={[-5, 0.02, 5]} size={[3.5, 3.5]} color="#305060" />

      {/* Roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[2.2, 28]} />
        <meshStandardMaterial color="#2a3038" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[28, 2.0]} />
        <meshStandardMaterial color="#2a3038" />
      </mesh>

      {/* Survey grid */}
      {gridLines.map((g, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={g.pos}>
          <planeGeometry args={g.size} />
          <meshStandardMaterial
            color="#4fd0e8"
            transparent
            opacity={0.35}
            emissive="#2a8090"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Contour-ish pads */}
      {[
        [2.5, 0.15, -4, 3.5, "#5a7060"],
        [-3, 0.2, 2, 2.8, "#6a6050"],
        [5, 0.12, 4, 2.2, "#4a6870"],
      ].map(([x, y, z, s, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <cylinderGeometry args={[s as number, (s as number) * 1.05, 0.25, 8]} />
          <meshStandardMaterial color={c as string} roughness={0.95} />
        </mesh>
      ))}

      {/* Measurement ticks / GCPs */}
      {markers.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <boxGeometry args={[0.35, 0.02, 0.06]} />
            <meshStandardMaterial color="#4fd0e8" emissive="#2a90a0" emissiveIntensity={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.06, 0.02, 0.35]} />
            <meshStandardMaterial color="#4fd0e8" emissive="#2a90a0" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Volume pile */}
      <mesh position={[6, 0.6, -5]} castShadow>
        <coneGeometry args={[1.8, 1.4, 7]} />
        <meshStandardMaterial color="#8a7060" roughness={1} />
      </mesh>
      <mesh position={[6.2, 0.05, -3.2]}>
        <ringGeometry args={[1.5, 1.65, 24]} />
        <meshStandardMaterial
          color="#4fd0e8"
          emissive="#208090"
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
