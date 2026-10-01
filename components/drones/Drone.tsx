"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePropDiscTexture } from "./textures";

type DroneProps = {
  lean: MutableRefObject<{ x: number; y: number; tx: number; ty: number }>;
  progress: MutableRefObject<number>;
  propDetail?: boolean;
  reducedMotion?: boolean;
};

const MAGNESIUM = "#c4cad3";
const MAGNESIUM_DARK = "#8e96a2";
const CARBON = "#15181d";
const GLOSS_BLACK = "#0b0e12";

function Blade({
  length,
  sign,
}: {
  length: number;
  sign: 1 | -1;
}) {
  return (
    <group position={[sign * (length * 0.5 + 0.03), 0, 0]}>
      <mesh>
        <boxGeometry args={[length, 0.007, 0.042]} />
        <meshStandardMaterial
          color="#1c2026"
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[sign * length * 0.42, 0, 0]} rotation={[sign * 0.28, 0, 0]}>
        <boxGeometry args={[length * 0.18, 0.005, 0.038]} />
        <meshStandardMaterial color="#2a3038" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Rotor({
  position,
  detail,
  reducedMotion,
  discTexture,
  dir = 1,
}: {
  position: [number, number, number];
  detail: boolean;
  reducedMotion: boolean;
  discTexture: THREE.Texture;
  dir?: number;
}) {
  const spin = useRef<THREE.Group>(null);
  const length = detail ? 0.26 : 0.2;

  useFrame((_, delta) => {
    if (reducedMotion || !spin.current) return;
    spin.current.rotation.y += delta * 42 * dir;
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.048, 0.056, 0.068, 12]} />
        <meshStandardMaterial color={CARBON} metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.042, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.028, 8]} />
        <meshStandardMaterial color="#4a525e" metalness={0.8} roughness={0.25} />
      </mesh>
      <group ref={spin} position={[0, 0.062, 0]}>
        <Blade length={length} sign={1} />
        <Blade length={length} sign={-1} />
      </group>
      {!reducedMotion ? (
        <group position={[0, 0.064, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <circleGeometry args={[length + 0.04, 24]} />
            <meshBasicMaterial
              map={discTexture}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
              opacity={0.7}
            />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

/**
 * Stylized DJI Inspire 2 — magnesium hull, raised T-mode carbon booms,
 * separate two-blade props (no overlapping through-blade), hanging gimbal.
 */
export function Drone({
  lean,
  progress,
  propDetail = true,
  reducedMotion = false,
}: DroneProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const gimbal = useRef<THREE.Group>(null);
  const ledPort = useRef<THREE.MeshStandardMaterial>(null);
  const ledStbd = useRef<THREE.MeshStandardMaterial>(null);
  const ledTail = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  const offset = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const smooth = useRef({ x: 0, y: 0 });
  const yaw = useRef(Math.PI);
  const discTexture = useMemo(() => makePropDiscTexture(), []);

  useFrame((state, delta) => {
    if (!root.current || !body.current) return;

    const target = lean.current;
    const s = smooth.current;
    s.x += (target.tx - s.x) * Math.min(1, delta * 4);
    s.y += (target.ty - s.y) * Math.min(1, delta * 4);

    camera.getWorldDirection(forward.current);
    right.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.current.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const down = THREE.MathUtils.clamp(-forward.current.y, 0, 1);
    const lookDown = THREE.MathUtils.smoothstep(down, 0.28, 0.92);
    const t = progress.current;
    const orthoOut =
      THREE.MathUtils.smoothstep(t, 0.5, 0.7) *
      (1 - THREE.MathUtils.smoothstep(t, 0.72, 0.8));

    const fwdDist = THREE.MathUtils.lerp(4.05, 2.55, lookDown);
    const scale = THREE.MathUtils.lerp(1.08, 0.32, Math.max(lookDown, orthoOut * 0.85));

    const time = state.clock.elapsedTime;
    const bob = reducedMotion ? 0 : Math.sin(time * 1.6) * 0.045;
    const sway = reducedMotion ? 0 : Math.sin(time * 0.9 + 1.7) * 0.015;

    offset.current
      .copy(camera.position)
      .addScaledVector(forward.current, fwdDist)
      .addScaledVector(right.current, s.x * 0.45 + sway)
      .addScaledVector(up.current, bob - s.y * 0.2);

    worldPos.current.lerp(offset.current, Math.min(1, delta * 6));
    root.current.position.copy(worldPos.current);
    root.current.scale.setScalar(scale);

    // Stay world-upright so a nadir camera sees the top of the airframe.
    const horiz = Math.hypot(forward.current.x, forward.current.z);
    if (horiz > 0.14) {
      yaw.current = Math.atan2(forward.current.x, forward.current.z);
    }
    root.current.rotation.set(s.y * 0.07, yaw.current, -s.x * 0.1, "YXZ");

    body.current.rotation.z = THREE.MathUtils.lerp(
      body.current.rotation.z,
      -s.x * 0.1,
      Math.min(1, delta * 5),
    );
    body.current.rotation.x = THREE.MathUtils.lerp(
      body.current.rotation.x,
      s.y * 0.06,
      Math.min(1, delta * 5),
    );

    if (gimbal.current) {
      gimbal.current.rotation.x = -body.current.rotation.x * 0.9;
      gimbal.current.rotation.z = -body.current.rotation.z * 0.9;
    }

    const pulse = (Math.sin(time * 4.2) + 1) * 0.5;
    if (ledPort.current) ledPort.current.emissiveIntensity = 0.9 + pulse * 1.5;
    if (ledStbd.current) ledStbd.current.emissiveIntensity = 0.9 + pulse * 1.5;
    if (ledTail.current) {
      ledTail.current.emissiveIntensity = time % 1.4 < 0.08 ? 3.2 : 0.25;
    }
  });

  // Wide T-mode: rotors sit well clear of each other and the hull.
  const boomX = 0.42;
  const boomY = 0.22;
  const rotorZ = 0.52;

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.13, 0.56]} />
          <meshStandardMaterial color={MAGNESIUM} metalness={0.78} roughness={0.28} />
        </mesh>
        {/* Dual battery packs */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} castShadow position={[sx * 0.07, 0.09, -0.04]}>
            <boxGeometry args={[0.1, 0.055, 0.32]} />
            <meshStandardMaterial color={MAGNESIUM_DARK} metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, 0.12, -0.04]}>
          <boxGeometry args={[0.08, 0.01, 0.18]} />
          <meshStandardMaterial color="#5a626e" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Nose */}
        <mesh castShadow position={[0, -0.005, 0.32]}>
          <boxGeometry args={[0.2, 0.1, 0.12]} />
          <meshStandardMaterial color={MAGNESIUM} metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.018, 0.384]}>
          <boxGeometry args={[0.13, 0.042, 0.012]} />
          <meshStandardMaterial color={GLOSS_BLACK} metalness={0.9} roughness={0.08} />
        </mesh>
        {/* Antenna */}
        <mesh position={[0.06, 0.2, -0.18]}>
          <cylinderGeometry args={[0.006, 0.006, 0.16, 6]} />
          <meshStandardMaterial color="#3a424c" />
        </mesh>
        <mesh position={[0.06, 0.29, -0.18]}>
          <sphereGeometry args={[0.014, 6, 6]} />
          <meshStandardMaterial color="#d0d6de" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Tail */}
        <mesh castShadow position={[0, 0.005, -0.32]}>
          <boxGeometry args={[0.17, 0.09, 0.1]} />
          <meshStandardMaterial color={MAGNESIUM_DARK} metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.02, -0.375]}>
          <boxGeometry args={[0.05, 0.02, 0.012]} />
          <meshStandardMaterial
            ref={ledTail}
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.25}
          />
        </mesh>
        {[-1, 1].map((sx) => (
          <group key={`vent${sx}`}>
            <mesh position={[sx * 0.134, -0.01, 0.08]}>
              <boxGeometry args={[0.008, 0.055, 0.18]} />
              <meshStandardMaterial color={CARBON} roughness={0.6} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[sx * 0.138, 0.02 - i * 0.02, 0.08]}>
                <boxGeometry args={[0.004, 0.006, 0.14]} />
                <meshStandardMaterial color="#2a323c" />
              </mesh>
            ))}
          </group>
        ))}

        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh
              castShadow
              position={[sx * boomX, boomY, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.022, 0.022, 1.12, 10]} />
              <meshStandardMaterial color={CARBON} metalness={0.5} roughness={0.35} />
            </mesh>
            <mesh
              castShadow
              position={[sx * boomX * 0.52, boomY * 0.48, 0]}
              rotation={[0, 0, sx * -0.95]}
            >
              <cylinderGeometry args={[0.018, 0.024, 0.34, 8]} />
              <meshStandardMaterial color={MAGNESIUM_DARK} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Transformed landing gear tucked under the boom */}
            <mesh
              castShadow
              position={[sx * (boomX * 0.72), boomY - 0.12, -0.08]}
              rotation={[0.55, 0, sx * 0.2]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
              <meshStandardMaterial color={CARBON} roughness={0.4} />
            </mesh>
            <mesh
              position={[sx * (boomX * 0.82), boomY - 0.2, -0.14]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
              <meshStandardMaterial color="#2c323c" roughness={0.5} />
            </mesh>

            <mesh position={[sx * boomX, boomY + 0.008, rotorZ + 0.05]}>
              <boxGeometry args={[0.032, 0.014, 0.02]} />
              <meshStandardMaterial
                ref={sx === -1 ? ledPort : ledStbd}
                color={sx === -1 ? "#ff3030" : "#25e060"}
                emissive={sx === -1 ? "#ff2020" : "#20d050"}
                emissiveIntensity={1.4}
              />
            </mesh>

            <Rotor
              position={[sx * boomX, boomY + 0.04, rotorZ]}
              detail={propDetail}
              reducedMotion={reducedMotion}
              discTexture={discTexture}
              dir={sx}
            />
            <Rotor
              position={[sx * boomX, boomY + 0.04, -rotorZ]}
              detail={propDetail}
              reducedMotion={reducedMotion}
              discTexture={discTexture}
              dir={-sx}
            />
          </group>
        ))}

        <group ref={gimbal} position={[0, -0.1, 0.26]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 0.028, 12]} />
            <meshStandardMaterial color={CARBON} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.042, -0.05, 0]}>
            <boxGeometry args={[0.012, 0.09, 0.048]} />
            <meshStandardMaterial color={CARBON} roughness={0.4} />
          </mesh>
          <mesh position={[-0.03, -0.04, 0]}>
            <boxGeometry args={[0.01, 0.06, 0.04]} />
            <meshStandardMaterial color={CARBON} roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, -0.082, 0.012]}>
            <boxGeometry args={[0.092, 0.072, 0.1]} />
            <meshStandardMaterial color={GLOSS_BLACK} metalness={0.75} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.082, 0.074]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.032, 0.04, 14]} />
            <meshStandardMaterial color="#1a1e26" metalness={0.85} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.082, 0.096]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.006, 14]} />
            <meshStandardMaterial
              color="#2a4a66"
              metalness={1}
              roughness={0.05}
              emissive="#183048"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>

        <pointLight position={[0, -0.3, 0]} intensity={0.45} distance={5} color="#8fd8e0" />
      </group>
    </group>
  );
}
