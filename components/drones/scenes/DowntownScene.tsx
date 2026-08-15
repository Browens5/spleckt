"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  getFacadeTextures,
  makeAsphaltTexture,
  makeConcreteTexture,
} from "../textures";
import { ANCHOR } from "../layout";
import { Car, FACE_NEG_Z, FACE_POS_Z, Streetlight, Tree } from "../kit";

function Building({
  position,
  size,
  facade,
  accent,
  /** Which side faces the street. */
  street: streetSide,
}: {
  position: [number, number, number];
  size: [number, number, number];
  facade: THREE.Texture;
  accent: string;
  street: "left" | "right";
}) {
  const [w, h, d] = size;
  const map = useMemo(() => {
    const t = facade.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(w / 2.2)), Math.max(1, Math.round(h / 3)));
    return t;
  }, [facade, w, h]);

  const faceX = streetSide === "left" ? w / 2 : -w / 2;
  const sign = streetSide === "left" ? 1 : -1;

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial attach="material-0" map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.85} />
        <meshStandardMaterial attach="material-1" map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.85} />
        <meshStandardMaterial attach="material-2" color="#1c242e" roughness={0.95} />
        <meshStandardMaterial attach="material-3" color="#1c242e" roughness={0.95} />
        <meshStandardMaterial attach="material-4" map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.85} />
        <meshStandardMaterial attach="material-5" map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[w * 0.18, h + 0.14, -d * 0.12]}>
        <boxGeometry args={[w * 0.28, 0.28, d * 0.28]} />
        <meshStandardMaterial color="#262e38" roughness={0.9} />
      </mesh>
      <mesh position={[-w * 0.22, h + 0.22, d * 0.08]}>
        <cylinderGeometry args={[0.05, 0.05, 0.44, 6]} />
        <meshStandardMaterial color="#3a424e" roughness={0.8} />
      </mesh>
      {/* Street-facing storefront */}
      <mesh position={[faceX + sign * 0.12, 0.55, 0]}>
        <boxGeometry args={[0.28, 0.08, d * 0.88]} />
        <meshStandardMaterial color={accent} roughness={0.5} emissive={accent} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[faceX + sign * 0.03, 0.88, 0]}>
        <boxGeometry args={[0.04, 0.16, d * 0.42]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[faceX + sign * 0.01, 0.26, 0]}>
        <boxGeometry args={[0.04, 0.48, d * 0.62]} />
        <meshStandardMaterial
          color="#101820"
          metalness={0.5}
          roughness={0.2}
          emissive="#2a4a5a"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

function TrafficLight({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 2.2, 6]} />
        <meshStandardMaterial color="#2a323c" />
      </mesh>
      <mesh position={[0.18, 2.15, 0]}>
        <boxGeometry args={[0.16, 0.42, 0.14]} />
        <meshStandardMaterial color="#1a1e24" />
      </mesh>
      <mesh position={[0.26, 2.28, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#3a1010" emissive="#ff2020" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0.26, 2.15, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#3a3010" />
      </mesh>
      <mesh position={[0.26, 2.02, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#103a18" />
      </mesh>
    </group>
  );
}

export function DowntownScene() {
  const facades = useMemo(() => getFacadeTextures(), []);
  const asphalt = useMemo(() => {
    const t = makeAsphaltTexture();
    t.repeat.set(3, 18);
    return t;
  }, []);
  const concrete = useMemo(() => {
    const t = makeConcreteTexture();
    t.repeat.set(1.2, 22);
    return t;
  }, []);

  const left = useMemo(
    () =>
      [
        { z: 10, h: 4.4, w: 2.3, d: 2.6, f: 0, a: "#3ec7c0" },
        { z: 6.2, h: 6.1, w: 2.5, d: 2.8, f: 1, a: "#e07050" },
        { z: 2.2, h: 3.8, w: 2.1, d: 2.4, f: 2, a: "#6a9fd0" },
        { z: -1.6, h: 7.2, w: 2.8, d: 3.0, f: 3, a: "#d4a05a" },
        { z: -5.6, h: 5.0, w: 2.4, d: 2.6, f: 0, a: "#5ec0b0" },
        { z: -9.4, h: 4.2, w: 2.2, d: 2.5, f: 1, a: "#c07090" },
        { z: -13.2, h: 6.4, w: 2.6, d: 2.8, f: 2, a: "#70b0d0" },
        { z: -17.2, h: 5.4, w: 2.3, d: 2.6, f: 3, a: "#e8b060" },
      ] as const,
    [],
  );
  const right = useMemo(
    () =>
      [
        { z: 11, h: 3.6, w: 2.2, d: 2.4, f: 2, a: "#8090c0" },
        { z: 7.2, h: 5.4, w: 2.4, d: 2.6, f: 3, a: "#50c0a0" },
        { z: 3.2, h: 7.0, w: 2.7, d: 2.9, f: 1, a: "#e8b060" },
        { z: -0.8, h: 4.6, w: 2.2, d: 2.5, f: 0, a: "#70b0d0" },
        { z: -4.8, h: 6.0, w: 2.5, d: 2.7, f: 2, a: "#c07090" },
        { z: -8.8, h: 3.9, w: 2.1, d: 2.4, f: 3, a: "#5ec0b0" },
        { z: -12.6, h: 5.8, w: 2.6, d: 2.8, f: 0, a: "#d4a05a" },
        { z: -16.6, h: 4.8, w: 2.3, d: 2.5, f: 1, a: "#6a9fd0" },
      ] as const,
    [],
  );

  return (
    <group position={[ANCHOR.downtown.x, 0, ANCHOR.downtown.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} receiveShadow>
        <planeGeometry args={[8, 42]} />
        <meshStandardMaterial map={asphalt} roughness={0.95} />
      </mesh>
      {[-18, -14, -10, -6, -2, 2, 6, 10, 14].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z]}>
          <planeGeometry args={[0.12, 1.5]} />
          <meshStandardMaterial color="#d8c070" emissive="#806020" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 8.4]}>
          <planeGeometry args={[0.38, 1.6]} />
          <meshStandardMaterial color="#c8ccd4" roughness={0.9} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.03, -4]} receiveShadow>
        <planeGeometry args={[1.8, 42]} />
        <meshStandardMaterial map={concrete} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.03, -4]} receiveShadow>
        <planeGeometry args={[1.8, 42]} />
        <meshStandardMaterial map={concrete} roughness={0.9} />
      </mesh>

      {left.map((b, i) => (
        <Building
          key={`l${i}`}
          position={[-5.0, 0, b.z]}
          size={[b.w, b.h, b.d]}
          facade={facades[b.f]}
          accent={b.a}
          street="left"
        />
      ))}
      {right.map((b, i) => (
        <Building
          key={`r${i}`}
          position={[5.0, 0, b.z]}
          size={[b.w, b.h, b.d]}
          facade={facades[b.f]}
          accent={b.a}
          street="right"
        />
      ))}

      {/* Background towers so the block feels deeper */}
      <mesh castShadow position={[-8.4, 4.2, -3]}>
        <boxGeometry args={[2.2, 8.4, 2.4]} />
        <meshStandardMaterial map={facades[1]} emissiveMap={facades[1]} emissive="#ffffff" emissiveIntensity={0.4} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[8.6, 5.1, -8]}>
        <boxGeometry args={[2.4, 10.2, 2.6]} />
        <meshStandardMaterial map={facades[2]} emissiveMap={facades[2]} emissive="#ffffff" emissiveIntensity={0.4} roughness={0.9} />
      </mesh>

      {/* Left curb: arm +X toward the road. Right curb: yaw PI so arm aims −X. */}
      <Streetlight position={[-2.7, 0, 8]} />
      <Streetlight position={[-2.7, 0, 2]} />
      <Streetlight position={[-2.7, 0, -5]} />
      <Streetlight position={[-2.7, 0, -12]} />
      <Streetlight position={[2.7, 0, 6]} rotation={Math.PI} />
      <Streetlight position={[2.7, 0, -1]} rotation={Math.PI} />
      <Streetlight position={[2.7, 0, -8]} rotation={Math.PI} />
      <Streetlight position={[2.7, 0, -15]} rotation={Math.PI} />

      <TrafficLight position={[-2.5, 0, 7.2]} />
      <TrafficLight position={[2.5, 0, 9.4]} rotation={Math.PI} />

      {/* Right-hand traffic on a −Z street: right lane faces −Z, left faces +Z */}
      <Car position={[1.15, 0, 5]} color="#3a6a90" rotation={FACE_NEG_Z} />
      <Car position={[1.2, 0, -3]} color="#8a4040" rotation={FACE_NEG_Z} />
      <Car position={[1.1, 0, -11]} color="#c4a050" rotation={FACE_NEG_Z} />
      <Car position={[-1.15, 0, 2]} color="#3a7050" rotation={FACE_POS_Z} />
      <Car position={[-1.1, 0, -7]} color="#5a4a80" rotation={FACE_POS_Z} />
      <Car position={[-1.2, 0, -16]} color="#704030" rotation={FACE_POS_Z} />

      <Tree position={[-3.4, 0, 4.5]} scale={0.7} />
      <Tree position={[3.5, 0, -6]} scale={0.75} />
      <Tree position={[-3.5, 0, -14]} scale={0.65} />
    </group>
  );
}
