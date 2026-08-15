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

const MAGNESIUM = "#b9bfc9";
const MAGNESIUM_DARK = "#8e96a2";
const CARBON = "#15181d";
const GLOSS_BLACK = "#0b0e12";

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
  const blades = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (blades.current) blades.current.rotation.y += delta * 46 * dir;
    if (disc.current) disc.current.rotation.y -= delta * 1.4 * dir;
  });

  return (
    <group position={position}>
      {/* Motor can */}
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.058, 0.07, 12]} />
        <meshStandardMaterial color={CARBON} metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
        <meshStandardMaterial color="#4a525e" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Two-blade prop */}
      <group ref={blades} position={[0, 0.065, 0]}>
        <mesh>
          <boxGeometry args={[detail ? 0.62 : 0.5, 0.008, 0.05]} />
          <meshStandardMaterial
            color="#22262c"
            metalness={0.4}
            roughness={0.5}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* Blade pitch tips */}
        <mesh position={[detail ? 0.28 : 0.22, 0, 0]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.006, 0.045]} />
          <meshStandardMaterial color="#2c313a" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-(detail ? 0.28 : 0.22), 0, 0]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.006, 0.045]} />
          <meshStandardMaterial color="#2c313a" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
      {/* Motion-blur disc */}
      {!reducedMotion ? (
        <mesh ref={disc} position={[0, 0.068, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[detail ? 0.32 : 0.26, 24]} />
          <meshBasicMaterial
            map={discTexture}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
    </group>
  );
}

/**
 * Stylized DJI Inspire 2 — magnesium fuselage, raised carbon boom arms
 * with fore/aft rotors, hanging gimbal camera, nav LEDs.
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
  const ledFront = useRef<THREE.MeshStandardMaterial>(null);
  const ledTail = useRef<THREE.MeshStandardMaterial>(null);
  const { camera } = useThree();
  const offset = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());
  const smooth = useRef({ x: 0, y: 0 });
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

    const time = state.clock.elapsedTime;
    const bob = reducedMotion ? 0 : Math.sin(time * 1.6) * 0.06;
    const sway = reducedMotion ? 0 : Math.sin(time * 0.9 + 1.7) * 0.02;

    offset.current
      .copy(camera.position)
      .addScaledVector(forward.current, 4.2)
      .addScaledVector(right.current, s.x * 0.7 + sway)
      .addScaledVector(up.current, bob - s.y * 0.35 + 0.15);

    worldPos.current.lerp(offset.current, Math.min(1, delta * 6));
    root.current.position.copy(worldPos.current);
    root.current.quaternion.copy(camera.quaternion);

    body.current.rotation.z = THREE.MathUtils.lerp(
      body.current.rotation.z,
      -s.x * 0.3,
      Math.min(1, delta * 5),
    );
    body.current.rotation.x = THREE.MathUtils.lerp(
      body.current.rotation.x,
      s.y * 0.2,
      Math.min(1, delta * 5),
    );

    // Gimbal counter-rotates to stay level, like a real stabilized camera
    if (gimbal.current) {
      gimbal.current.rotation.x = -body.current.rotation.x * 0.9;
      gimbal.current.rotation.z = -body.current.rotation.z * 0.9;
    }

    // Nav LED pulses
    const pulse = (Math.sin(time * 4.2) + 1) * 0.5;
    if (ledFront.current) ledFront.current.emissiveIntensity = 0.8 + pulse * 1.6;
    if (ledTail.current) {
      const strobe = time % 1.4 < 0.08 ? 3.2 : 0.25;
      ledTail.current.emissiveIntensity = strobe;
    }

    void progress.current;
  });

  const boomX = 0.34;
  const boomY = 0.16;
  const rotorZ = 0.36;

  return (
    <group ref={root}>
      <group ref={body}>
        {/* ——— Fuselage ——— */}
        {/* Main hull, tapered magnesium shell */}
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.13, 0.52]} />
          <meshStandardMaterial color={MAGNESIUM} metalness={0.75} roughness={0.32} />
        </mesh>
        {/* Upper spine / battery bay */}
        <mesh castShadow position={[0, 0.085, -0.04]}>
          <boxGeometry args={[0.18, 0.05, 0.34]} />
          <meshStandardMaterial color={MAGNESIUM_DARK} metalness={0.7} roughness={0.35} />
        </mesh>
        {/* Battery latches */}
        <mesh position={[0, 0.11, -0.04]}>
          <boxGeometry args={[0.1, 0.012, 0.2]} />
          <meshStandardMaterial color="#5a626e" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Nose cone */}
        <mesh castShadow position={[0, -0.005, 0.3]}>
          <boxGeometry args={[0.18, 0.1, 0.1]} />
          <meshStandardMaterial color={MAGNESIUM} metalness={0.75} roughness={0.3} />
        </mesh>
        {/* FPV pilot camera window */}
        <mesh position={[0, 0.015, 0.352]}>
          <boxGeometry args={[0.12, 0.045, 0.012]} />
          <meshStandardMaterial
            color={GLOSS_BLACK}
            metalness={0.9}
            roughness={0.08}
          />
        </mesh>
        {/* Tail taper */}
        <mesh castShadow position={[0, 0.005, -0.3]}>
          <boxGeometry args={[0.16, 0.09, 0.09]} />
          <meshStandardMaterial color={MAGNESIUM_DARK} metalness={0.7} roughness={0.35} />
        </mesh>
        {/* Tail strobe */}
        <mesh position={[0, 0.02, -0.35]}>
          <boxGeometry args={[0.05, 0.02, 0.012]} />
          <meshStandardMaterial
            ref={ledTail}
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.25}
          />
        </mesh>
        {/* Side vents */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.125, -0.01, 0.1]}>
            <boxGeometry args={[0.008, 0.06, 0.16]} />
            <meshStandardMaterial color={CARBON} roughness={0.6} />
          </mesh>
        ))}

        {/* ——— Boom arms (T-mode raised) ——— */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            {/* Carbon boom tube running fore-aft */}
            <mesh castShadow position={[sx * boomX, boomY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.84, 10]} />
              <meshStandardMaterial color={CARBON} metalness={0.5} roughness={0.35} />
            </mesh>
            {/* Lift pivot strut connecting hull to boom */}
            <mesh
              castShadow
              position={[sx * boomX * 0.55, boomY * 0.45, 0]}
              rotation={[0, 0, sx * -0.85]}
            >
              <cylinderGeometry args={[0.02, 0.026, 0.28, 8]} />
              <meshStandardMaterial color={MAGNESIUM_DARK} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Landing skid dropping down-back */}
            <mesh
              castShadow
              position={[sx * (boomX * 0.78), -0.1, -0.1]}
              rotation={[0.35, 0, sx * 0.35]}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
              <meshStandardMaterial color={CARBON} roughness={0.4} />
            </mesh>
            <mesh position={[sx * (boomX * 0.92), -0.22, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.2, 6]} />
              <meshStandardMaterial color="#2c323c" roughness={0.5} />
            </mesh>

            {/* Front nav LED (port red / starboard green) */}
            <mesh position={[sx * boomX, boomY + 0.005, rotorZ + 0.06]}>
              <boxGeometry args={[0.03, 0.014, 0.02]} />
              <meshStandardMaterial
                ref={sx === -1 ? ledFront : undefined}
                color={sx === -1 ? "#ff3030" : "#25e060"}
                emissive={sx === -1 ? "#ff2020" : "#20d050"}
                emissiveIntensity={1.4}
              />
            </mesh>

            {/* Rotors fore + aft */}
            <Rotor
              position={[sx * boomX, boomY + 0.035, rotorZ]}
              detail={propDetail}
              reducedMotion={reducedMotion}
              discTexture={discTexture}
              dir={sx as 1 | -1}
            />
            <Rotor
              position={[sx * boomX, boomY + 0.035, -rotorZ]}
              detail={propDetail}
              reducedMotion={reducedMotion}
              discTexture={discTexture}
              dir={-sx as 1 | -1}
            />
          </group>
        ))}

        {/* ——— Gimbal camera (counter-stabilized) ——— */}
        <group ref={gimbal} position={[0, -0.09, 0.24]}>
          {/* Yaw motor */}
          <mesh>
            <cylinderGeometry args={[0.032, 0.032, 0.03, 12]} />
            <meshStandardMaterial color={CARBON} metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Roll bracket */}
          <mesh position={[0.04, -0.045, 0]}>
            <boxGeometry args={[0.014, 0.08, 0.05]} />
            <meshStandardMaterial color={CARBON} roughness={0.4} />
          </mesh>
          {/* Camera body */}
          <mesh castShadow position={[0, -0.075, 0.01]}>
            <boxGeometry args={[0.09, 0.075, 0.1]} />
            <meshStandardMaterial color={GLOSS_BLACK} metalness={0.75} roughness={0.2} />
          </mesh>
          {/* Lens barrel */}
          <mesh position={[0, -0.075, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.034, 0.045, 14]} />
            <meshStandardMaterial color="#1a1e26" metalness={0.85} roughness={0.15} />
          </mesh>
          {/* Lens glass */}
          <mesh position={[0, -0.075, 0.094]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.006, 14]} />
            <meshStandardMaterial
              color="#2a4a66"
              metalness={1}
              roughness={0.05}
              emissive="#183048"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>

        {/* Soft under-glow so the drone reads against dark scenes */}
        <pointLight position={[0, -0.3, 0]} intensity={0.5} distance={5} color="#8fd8e0" />
      </group>
    </group>
  );
}
