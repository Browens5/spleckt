"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sunState } from "./daylight";

/** Shared scene props — cars face +X; streetlights arm toward +X. */

export function Car({
  position,
  color,
  /** Yaw in radians. 0 = faces +X. */
  rotation = 0,
}: {
  position: [number, number, number];
  color: string;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[0.9, 0.24, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[0.08, 0.4, 0]}>
        <boxGeometry args={[0.42, 0.18, 0.38]} />
        <meshStandardMaterial color="#1a222c" metalness={0.6} roughness={0.15} />
      </mesh>
      {([
        [0.28, 0.19],
        [0.28, -0.19],
        [-0.28, 0.19],
        [-0.28, -0.19],
      ] as const).map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.09, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 10]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.46, 0.22, 0.13]}>
        <boxGeometry args={[0.02, 0.05, 0.08]} />
        <meshStandardMaterial color="#fff8d8" emissive="#ffedb0" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0.46, 0.22, -0.13]}>
        <boxGeometry args={[0.02, 0.05, 0.08]} />
        <meshStandardMaterial color="#fff8d8" emissive="#ffedb0" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[-0.46, 0.22, 0]}>
        <boxGeometry args={[0.02, 0.05, 0.3]} />
        <meshStandardMaterial color="#a02020" emissive="#e03030" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

/** Loops a car along a Z corridor. `dir` +1 travels toward +Z. */
export function DrivingCar({
  x,
  color,
  zStart,
  zEnd,
  speed = 3.2,
  dir = -1,
  reducedMotion = false,
}: {
  x: number;
  color: string;
  zStart: number;
  zEnd: number;
  speed?: number;
  dir?: 1 | -1;
  reducedMotion?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const lo = Math.min(zStart, zEnd);
  const hi = Math.max(zStart, zEnd);
  const yaw = dir < 0 ? FACE_NEG_Z : FACE_POS_Z;

  useFrame((_, delta) => {
    if (!ref.current || reducedMotion) return;
    let z = ref.current.position.z + dir * speed * delta;
    if (dir < 0 && z < lo) z = hi;
    if (dir > 0 && z > hi) z = lo;
    ref.current.position.z = z;
  });

  return (
    <group ref={ref} position={[x, 0, zStart]}>
      <Car position={[0, 0, 0]} color={color} rotation={yaw} />
    </group>
  );
}

/** Arm points +X. Rotate the group so the arm faces the road. */
export function Streetlight({
  position,
  /** Yaw. 0 = arm +X (use PI on the right curb so the arm aims at the street). */
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const night = 1 - sunState.factor;
    if (lamp.current) lamp.current.emissiveIntensity = 0.15 + night * 1.05;
    if (light.current) light.current.intensity = night * 0.4;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.8, 6]} />
        <meshStandardMaterial color="#2c3440" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.32, 2.72, 0]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.55, 0.04, 0.04]} />
        <meshStandardMaterial color="#2c3440" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.55, 2.55, 0]}>
        <boxGeometry args={[0.2, 0.08, 0.12]} />
        <meshStandardMaterial
          ref={lamp}
          color="#f0e6c8"
          emissive="#f0d080"
          emissiveIntensity={1.1}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[0.45, 2.35, 0]}
        intensity={0.38}
        distance={6}
        color="#ffd9a0"
      />
    </group>
  );
}

export function Tree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
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

/** Face +X = heading down a +X street. For a Z-running road:
 *  right lane (travel −Z) = FACE_NEG_Z, left lane (travel +Z) = FACE_POS_Z */
export const FACE_NEG_Z = -Math.PI / 2;
export const FACE_POS_Z = Math.PI / 2;
export const FACE_NEG_X = Math.PI;
export const FACE_POS_X = 0;
