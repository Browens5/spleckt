"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sunState } from "../daylight";

export function TowerCrane({
  position,
  rotation = 0,
  height = 9,
  phase = 0,
  reducedMotion = false,
}: {
  position: [number, number, number];
  rotation?: number;
  height?: number;
  phase?: number;
  reducedMotion?: boolean;
}) {
  const jib = useRef<THREE.Group>(null);
  const hook = useRef<THREE.Group>(null);
  const cable = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime + phase;
    if (jib.current) jib.current.rotation.y = Math.sin(t * 0.11) * 0.85;
    const lift = (Math.sin(t * 0.32) + 1) * 0.5;
    const drop = 1.1 + lift * (height - 2.4);
    if (hook.current) hook.current.position.y = height - 0.35 - drop;
    if (cable.current) {
      cable.current.scale.y = drop / 3.6;
      cable.current.position.y = height - 0.35 - drop / 2;
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[0.38, height, 0.38]} />
        <meshStandardMaterial color="#d8a040" metalness={0.4} roughness={0.45} />
      </mesh>
      <group ref={jib}>
        <mesh castShadow position={[2.6, height - 0.25, 0]}>
          <boxGeometry args={[6.2, 0.24, 0.3]} />
          <meshStandardMaterial color="#e0b050" metalness={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[-1.4, height - 0.45, 0]}>
          <boxGeometry args={[1.0, 0.75, 0.75]} />
          <meshStandardMaterial color="#2a3038" />
        </mesh>
        <mesh position={[0, height + 0.18, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#ff4030" emissive="#ff2020" emissiveIntensity={2.4} />
        </mesh>
        <mesh ref={cable} position={[5.4, height - 2.2, 0]}>
          <boxGeometry args={[0.04, 3.6, 0.04]} />
          <meshStandardMaterial color="#666" />
        </mesh>
        <group ref={hook} position={[5.4, height - 4.1, 0]}>
          <mesh>
            <boxGeometry args={[0.28, 0.22, 0.28]} />
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.28, 0]} castShadow>
            <boxGeometry args={[1.6, 0.16, 0.28]} />
            <meshStandardMaterial color="#8a9098" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function Excavator({
  position,
  rotation = 0,
  phase = 0,
  reducedMotion = false,
}: {
  position: [number, number, number];
  rotation?: number;
  phase?: number;
  reducedMotion?: boolean;
}) {
  const cab = useRef<THREE.Group>(null);
  const boom = useRef<THREE.Group>(null);
  const stick = useRef<THREE.Group>(null);
  const bucket = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime + phase;
    if (cab.current) cab.current.rotation.y = Math.sin(t * 0.18) * 0.7;
    if (boom.current) boom.current.rotation.z = -0.35 + Math.sin(t * 0.42) * 0.22;
    if (stick.current) stick.current.rotation.z = 0.55 + Math.sin(t * 0.42 + 0.9) * 0.4;
    if (bucket.current) bucket.current.rotation.z = 0.4 + Math.sin(t * 0.42 + 1.6) * 0.5;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 1.7, 8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <group ref={cab} position={[0, 0.55, 0]}>
        <mesh castShadow position={[0, 0.28, 0]}>
          <boxGeometry args={[1.7, 0.7, 1.15]} />
          <meshStandardMaterial color="#d07020" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.15, 0.72, 0.15]}>
          <boxGeometry args={[0.7, 0.55, 0.7]} />
          <meshStandardMaterial color="#2a3038" />
        </mesh>
        <group ref={boom} position={[0.7, 0.55, 0]} rotation={[0, 0, -0.35]}>
          <mesh castShadow position={[0.85, 0, 0]}>
            <boxGeometry args={[1.8, 0.18, 0.18]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <group ref={stick} position={[1.7, 0, 0]} rotation={[0, 0, 0.55]}>
            <mesh castShadow position={[0.7, 0, 0]}>
              <boxGeometry args={[1.5, 0.14, 0.14]} />
              <meshStandardMaterial color="#2c2c2c" />
            </mesh>
            <group ref={bucket} position={[1.45, 0, 0]} rotation={[0, 0, 0.4]}>
              <mesh castShadow position={[0.22, -0.12, 0]}>
                <boxGeometry args={[0.5, 0.38, 0.55]} />
                <meshStandardMaterial color="#444" />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export function Dozer({
  position,
  phase = 0,
  reducedMotion = false,
}: {
  position: [number, number, number];
  phase?: number;
  reducedMotion?: boolean;
}) {
  const body = useRef<THREE.Group>(null);
  const dirt = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion || !body.current) return;
    const t = state.clock.elapsedTime + phase;
    const u = (Math.sin(t * 0.28) + 1) * 0.5;
    const z = THREE.MathUtils.lerp(-5.5, 5.2, u);
    body.current.position.z = z;
    body.current.rotation.y = Math.cos(t * 0.28) > 0 ? 0 : Math.PI;
    if (dirt.current) {
      dirt.current.position.z = z + (body.current.rotation.y === 0 ? 1.35 : -1.35);
      dirt.current.scale.set(1, 0.45 + u * 0.35, 1);
    }
  });

  return (
    <group position={position}>
      <group ref={body}>
        <mesh castShadow position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 1.8, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh castShadow position={[0, 0.62, 0]}>
          <boxGeometry args={[1.15, 0.55, 1.7]} />
          <meshStandardMaterial color="#d8a020" metalness={0.25} roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.05, -0.15]}>
          <boxGeometry args={[0.7, 0.45, 0.7]} />
          <meshStandardMaterial color="#2a3038" />
        </mesh>
        <mesh castShadow position={[0, 0.45, 1.15]}>
          <boxGeometry args={[1.5, 0.7, 0.1]} />
          <meshStandardMaterial color="#c8c0b0" metalness={0.4} roughness={0.45} />
        </mesh>
      </group>
      <mesh ref={dirt} position={[0, 0.18, 1.35]} castShadow>
        <sphereGeometry args={[0.55, 7, 6]} />
        <meshStandardMaterial color="#6a4a28" roughness={1} />
      </mesh>
    </group>
  );
}

export function WorkLight({
  position,
  rotation = [0.55, -0.7, 0] as [number, number, number],
  height = 3.4,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
}) {
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const night = 1 - sunState.factor;
    if (lamp.current) lamp.current.emissiveIntensity = 0.2 + night * 1.6;
    if (light.current) light.current.intensity = night * 1.0;
  });

  return (
    <group position={position}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, height, 6]} />
        <meshStandardMaterial color="#3a4048" />
      </mesh>
      <mesh position={[0, height, 0]} rotation={rotation}>
        <boxGeometry args={[0.55, 0.32, 0.16]} />
        <meshStandardMaterial
          ref={lamp}
          color="#f5e8c8"
          emissive="#ffe0a0"
          emissiveIntensity={1.8}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[0, height - 0.3, 0]}
        intensity={1.0}
        distance={16}
        color="#ffd9a0"
      />
    </group>
  );
}
