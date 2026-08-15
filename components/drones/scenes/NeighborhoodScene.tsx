"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  makeAsphaltTexture,
  makeGrassTexture,
  makeShingleTexture,
  makeSidingTexture,
} from "../textures";
import { ANCHOR } from "../layout";
import { Car, FACE_NEG_X, FACE_POS_X, Streetlight, Tree } from "../kit";

function House({
  position,
  /** Yaw. Door is on local +Z; rotate so the door faces the street. */
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
      <mesh castShadow position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.45, 0.85, 4]} />
        <meshStandardMaterial map={shingles} color={roof} roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0.5, 1.9, -0.3]}>
        <boxGeometry args={[0.18, 0.5, 0.18]} />
        <meshStandardMaterial color="#8a5a48" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, 0.76]}>
        <boxGeometry args={[0.35, 0.7, 0.05]} />
        <meshStandardMaterial color="#3a2a20" />
      </mesh>
      <mesh position={[-0.5, 0.85, 0.76]}>
        <boxGeometry args={[0.32, 0.32, 0.04]} />
        <meshStandardMaterial color="#b8d8e8" emissive="#406070" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.5, 0.85, 0.76]}>
        <boxGeometry args={[0.32, 0.32, 0.04]} />
        <meshStandardMaterial color="#b8d8e8" emissive="#406070" emissiveIntensity={0.25} />
      </mesh>
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

export function NeighborhoodScene({
  density = "high",
}: {
  density?: "low" | "medium" | "high";
}) {
  const left = useMemo(() => {
    const all = [
      { z: 8, b: "#e0d0b8", roof: "#6a3830" },
      { z: 3, b: "#d0c0a8", roof: "#4a5060" },
      { z: -2, b: "#c8b898", roof: "#7a5038" },
      { z: -7, b: "#d8c8b0", roof: "#5a4038" },
      { z: -12, b: "#e8d8c0", roof: "#805040" },
      { z: -17, b: "#d4c4a8", roof: "#3a4858" },
    ];
    if (density === "low") return all.slice(0, 3);
    if (density === "medium") return all.slice(0, 4);
    return all;
  }, [density]);

  const right = useMemo(() => {
    const all = [
      { z: 6, b: "#c0b090", roof: "#704038" },
      { z: 1, b: "#dcccb4", roof: "#6a4440" },
      { z: -4, b: "#e0d0b8", roof: "#4a5060" },
      { z: -9, b: "#d0c0a8", roof: "#7a5038" },
      { z: -14, b: "#c8b898", roof: "#5a4038" },
      { z: -19, b: "#d8c8b0", roof: "#805040" },
    ];
    if (density === "low") return all.slice(0, 3);
    if (density === "medium") return all.slice(0, 4);
    return all;
  }, [density]);

  const grass = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(10, 10);
    return t;
  }, []);
  const street = useMemo(() => {
    const t = makeAsphaltTexture(9);
    t.repeat.set(1.6, 12);
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
    <group position={[ANCHOR.neighborhood.x, 0, ANCHOR.neighborhood.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} receiveShadow>
        <planeGeometry args={[36, 40]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>

      {/* North–south street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -4]}>
        <planeGeometry args={[3.4, 36]} />
        <meshStandardMaterial map={street} roughness={0.95} />
      </mesh>
      {/* Cross street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, -4]}>
        <planeGeometry args={[28, 2.6]} />
        <meshStandardMaterial map={street} roughness={0.95} />
      </mesh>

      {left.map((h, i) => (
        <group key={`l${i}`}>
          <House
            position={[-5.2, 0, h.z]}
            rotation={-Math.PI / 2}
            body={h.b}
            roof={h.roof}
            siding={siding}
            shingles={shingles}
          />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.03, h.z + 0.2]}>
            <planeGeometry args={[2.2, 1.2]} />
            <meshStandardMaterial color="#5a5850" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {right.map((h, i) => (
        <group key={`r${i}`}>
          <House
            position={[5.2, 0, h.z]}
            rotation={Math.PI / 2}
            body={h.b}
            roof={h.roof}
            siding={siding}
            shingles={shingles}
          />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.2, 0.03, h.z - 0.2]}>
            <planeGeometry args={[2.2, 1.2]} />
            <meshStandardMaterial color="#5a5850" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {left.map((h, i) => (
        <Tree key={`tl${i}`} position={[-3.6, 0, h.z + 1.6]} scale={0.85 + (i % 3) * 0.08} />
      ))}
      {right.map((h, i) => (
        <Tree key={`tr${i}`} position={[3.7, 0, h.z - 1.5]} scale={0.8 + (i % 2) * 0.12} />
      ))}

      <Streetlight position={[-2.0, 0, 7]} />
      <Streetlight position={[-2.0, 0, -2]} />
      <Streetlight position={[-2.0, 0, -12]} />
      <Streetlight position={[2.0, 0, 4]} rotation={Math.PI} />
      <Streetlight position={[2.0, 0, -6]} rotation={Math.PI} />
      <Streetlight position={[2.0, 0, -16]} rotation={Math.PI} />

      {/* Parked in driveways, facing the street */}
      <Car position={[-3.1, 0, left[0].z + 0.15]} color="#4a6080" rotation={FACE_POS_X} />
      {right[1] ? (
        <Car position={[3.1, 0, right[1].z - 0.15]} color="#704040" rotation={FACE_NEG_X} />
      ) : null}

      <group position={[1.8, 0, 9]}>
        <mesh castShadow position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 2.4, 6]} />
          <meshStandardMaterial color="#2c3440" />
        </mesh>
        <mesh position={[0, 2.45, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#ffe8c0" emissive="#ffd9a0" emissiveIntensity={1.4} />
        </mesh>
        <pointLight position={[0, 2.3, 0]} intensity={0.45} distance={7} color="#ffd9a0" />
      </group>
    </group>
  );
}
