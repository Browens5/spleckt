"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  makeAsphaltTexture,
  makeGrassTexture,
  makeShingleTexture,
  makeSidingTexture,
} from "../textures";

function House({
  position,
  rotation = 0,
  body = "#d8c8b0",
  roof = "#7a4030",
  siding,
  shingles,
}: {
  position: [number, number, number];
  rotation?: number;
  body?: string;
  roof?: string;
  siding: THREE.Texture;
  shingles: THREE.Texture;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.5]} />
        <meshStandardMaterial map={siding} color={body} roughness={0.85} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.45, 0.85, 4]} />
        <meshStandardMaterial map={shingles} color={roof} roughness={0.75} />
      </mesh>
      {/* Chimney */}
      <mesh castShadow position={[0.5, 1.9, -0.3]}>
        <boxGeometry args={[0.18, 0.5, 0.18]} />
        <meshStandardMaterial color="#8a5a48" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.45, 0.76]}>
        <boxGeometry args={[0.35, 0.7, 0.05]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.5, 0.85, 0.76]}>
        <boxGeometry args={[0.32, 0.32, 0.04]} />
        <meshStandardMaterial color="#b8d8e8" emissive="#406070" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.5, 0.85, 0.76]}>
        <boxGeometry args={[0.32, 0.32, 0.04]} />
        <meshStandardMaterial color="#b8d8e8" emissive="#406070" emissiveIntensity={0.25} />
      </mesh>
      {/* Garage */}
      <mesh castShadow position={[1.4, 0.45, 0.1]}>
        <boxGeometry args={[1.0, 0.9, 1.2]} />
        <meshStandardMaterial color={body} roughness={0.9} />
      </mesh>
      <mesh position={[1.4, 0.4, 0.72]}>
        <boxGeometry args={[0.75, 0.65, 0.04]} />
        <meshStandardMaterial color="#4a5058" />
      </mesh>
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.8, 5]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <coneGeometry args={[0.55, 1.1, 6]} />
        <meshStandardMaterial color="#3a6040" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <coneGeometry args={[0.4, 0.8, 6]} />
        <meshStandardMaterial color="#4a7850" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function NeighborhoodScene({
  density = "high",
}: {
  density?: "low" | "medium" | "high";
}) {
  const houses = useMemo(() => {
    const all = [
      { p: [-4, 0, -20] as [number, number, number], r: 0.1, b: "#e0d0b8", roof: "#6a3830" },
      { p: [-1, 0, -22] as [number, number, number], r: -0.05, b: "#d0c0a8", roof: "#4a5060" },
      { p: [2.5, 0, -21] as [number, number, number], r: 0.08, b: "#c8b898", roof: "#7a5038" },
      { p: [5.5, 0, -23] as [number, number, number], r: -0.12, b: "#d8c8b0", roof: "#5a4038" },
      { p: [-5, 0, -25] as [number, number, number], r: 0.2, b: "#e8d8c0", roof: "#805040" },
      { p: [-2, 0, -26.5] as [number, number, number], r: 0, b: "#d4c4a8", roof: "#3a4858" },
      { p: [1.5, 0, -25.5] as [number, number, number], r: -0.15, b: "#c0b090", roof: "#704038" },
      { p: [4.5, 0, -27] as [number, number, number], r: 0.05, b: "#dcccb4", roof: "#6a4440" },
    ];
    if (density === "low") return all.slice(0, 4);
    if (density === "medium") return all.slice(0, 6);
    return all;
  }, [density]);

  const trees = useMemo(() => {
    const pts: { p: [number, number, number]; s: number }[] = [
      { p: [-3.2, 0, -19], s: 1 },
      { p: [0.5, 0, -20.5], s: 0.85 },
      { p: [3.8, 0, -19.8], s: 1.1 },
      { p: [-6, 0, -23], s: 0.9 },
      { p: [6.5, 0, -24], s: 1 },
      { p: [-0.5, 0, -28], s: 1.15 },
      { p: [3, 0, -28.5], s: 0.8 },
      { p: [-4, 0, -28], s: 1 },
    ];
    return density === "low" ? pts.slice(0, 4) : pts;
  }, [density]);

  const grass = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(7, 6);
    return t;
  }, []);
  const street = useMemo(() => {
    const t = makeAsphaltTexture(9);
    t.repeat.set(1.4, 7);
    return t;
  }, []);
  const siding = useMemo(() => {
    const t = makeSidingTexture();
    t.repeat.set(3, 1.6);
    return t;
  }, []);
  const shingles = useMemo(() => {
    const t = makeShingleTexture();
    t.repeat.set(2.4, 1.4);
    return t;
  }, []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -24]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>

      {/* Street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -23]}>
        <planeGeometry args={[3.2, 16]} />
        <meshStandardMaterial map={street} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.02, -24]}>
        <planeGeometry args={[2.4, 18]} />
        <meshStandardMaterial map={street} roughness={0.95} />
      </mesh>

      {/* Warm porch-lit yards */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.015, -23]}>
        <planeGeometry args={[4, 14]} />
        <meshStandardMaterial map={grass} color="#c8dcc0" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.015, -23]}>
        <planeGeometry args={[4, 14]} />
        <meshStandardMaterial map={grass} color="#c8dcc0" roughness={1} />
      </mesh>

      {houses.map((h, i) => (
        <House
          key={i}
          position={h.p}
          rotation={h.r}
          body={h.b}
          roof={h.roof}
          siding={siding}
          shingles={shingles}
        />
      ))}
      {trees.map((t, i) => (
        <Tree key={i} position={t.p} scale={t.s} />
      ))}

      {/* Driveways */}
      {houses.slice(0, 4).map((h, i) => (
        <mesh
          key={`d${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[h.p[0] + 1.2, 0.03, h.p[2] + 1.4]}
        >
          <planeGeometry args={[1.1, 1.8]} />
          <meshStandardMaterial color="#5a5850" roughness={0.95} />
        </mesh>
      ))}

      {/* Street lamp for evening warmth */}
      <group position={[1.9, 0, -19]}>
        <mesh castShadow position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 2.4, 6]} />
          <meshStandardMaterial color="#2c3440" />
        </mesh>
        <mesh position={[0, 2.45, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#ffe8c0" emissive="#ffd9a0" emissiveIntensity={1.4} />
        </mesh>
        <pointLight position={[0, 2.3, 0]} intensity={0.5} distance={7} color="#ffd9a0" />
      </group>
    </group>
  );
}
