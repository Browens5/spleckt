"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type DroneProps = {
  lean: MutableRefObject<{ x: number; y: number; tx: number; ty: number }>;
  progress: MutableRefObject<number>;
  propDetail?: boolean;
  reducedMotion?: boolean;
};

function Prop({
  position,
  detail,
  reducedMotion,
}: {
  position: [number, number, number];
  detail: boolean;
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y += delta * 38;
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.05, 8]} />
        <meshStandardMaterial color="#1a1e24" metalness={0.6} roughness={0.35} />
      </mesh>
      <group ref={ref} position={[0, 0.04, 0]}>
        <mesh>
          <boxGeometry args={[detail ? 0.55 : 0.42, 0.012, 0.06]} />
          <meshStandardMaterial
            color="#c8d0d8"
            metalness={0.4}
            roughness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[detail ? 0.55 : 0.42, 0.012, 0.06]} />
          <meshStandardMaterial
            color="#c8d0d8"
            metalness={0.4}
            roughness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Stylized DJI Matrice 4E — stays screen-centered with pointer lean. */
export function Drone({
  lean,
  progress,
  propDetail = true,
  reducedMotion = false,
}: DroneProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const offset = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const smooth = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!root.current || !body.current) return;

    const target = lean.current;
    const s = smooth.current;
    s.x += (target.tx - s.x) * Math.min(1, delta * 4);
    s.y += (target.ty - s.y) * Math.min(1, delta * 4);

    camera.getWorldDirection(forward.current);
    right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.current.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const bob = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.6) * 0.06;
    const dist = 4.2;

    offset.current
      .copy(camera.position)
      .addScaledVector(forward.current, dist)
      .addScaledVector(right.current, s.x * 0.7)
      .addScaledVector(up.current, bob - s.y * 0.35 + 0.15);

    worldPos.current.lerp(offset.current, Math.min(1, delta * 6));
    root.current.position.copy(worldPos.current);
    root.current.quaternion.copy(camera.quaternion);

    body.current.rotation.z = THREE.MathUtils.lerp(
      body.current.rotation.z,
      -s.x * 0.28,
      Math.min(1, delta * 5),
    );
    body.current.rotation.x = THREE.MathUtils.lerp(
      body.current.rotation.x,
      s.y * 0.18,
      Math.min(1, delta * 5),
    );

    void progress.current;
  });

  const armY = 0.02;
  const armReach = 0.42;

  return (
    <group ref={root} scale={0.95}>
      <group ref={body}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.14, 0.36]} />
          <meshStandardMaterial color="#1c222b" metalness={0.55} roughness={0.32} />
        </mesh>
        <mesh castShadow position={[0, 0.09, -0.02]}>
          <boxGeometry args={[0.28, 0.06, 0.22]} />
          <meshStandardMaterial color="#2a323e" metalness={0.5} roughness={0.35} />
        </mesh>

        <mesh position={[0, 0.02, 0.185]}>
          <boxGeometry args={[0.38, 0.04, 0.02]} />
          <meshStandardMaterial color="#3ec7c0" emissive="#1a6a66" emissiveIntensity={0.4} />
        </mesh>

        {(
          [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
          ] as const
        ).map(([sx, sz], i) => (
          <group key={i}>
            <mesh
              castShadow
              position={[sx * armReach * 0.45, armY, sz * armReach * 0.42]}
              rotation={[0, Math.atan2(sz, sx) * 0.15, sx * 0.08]}
            >
              <boxGeometry args={[0.48, 0.04, 0.05]} />
              <meshStandardMaterial color="#232a34" metalness={0.5} roughness={0.4} />
            </mesh>
            <Prop
              position={[sx * armReach, armY + 0.04, sz * armReach * 0.9]}
              detail={propDetail}
              reducedMotion={reducedMotion}
            />
          </group>
        ))}

        <mesh castShadow position={[0.14, -0.16, 0]}>
          <boxGeometry args={[0.03, 0.18, 0.03]} />
          <meshStandardMaterial color="#3a4452" />
        </mesh>
        <mesh castShadow position={[-0.14, -0.16, 0]}>
          <boxGeometry args={[0.03, 0.18, 0.03]} />
          <meshStandardMaterial color="#3a4452" />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.36, 0.025, 0.04]} />
          <meshStandardMaterial color="#4a5565" />
        </mesh>

        <mesh castShadow position={[0, -0.08, 0.2]}>
          <boxGeometry args={[0.16, 0.1, 0.1]} />
          <meshStandardMaterial color="#11151b" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[-0.035, -0.08, 0.26]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
          <meshStandardMaterial color="#0a0c10" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.04, -0.08, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.03, 12]} />
          <meshStandardMaterial color="#1a3040" metalness={0.8} roughness={0.15} />
        </mesh>

        <mesh position={[0, 0.22, -0.08]}>
          <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
          <meshStandardMaterial color="#555e6c" />
        </mesh>
        <mesh position={[0, 0.36, -0.08]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#d8dee8" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
