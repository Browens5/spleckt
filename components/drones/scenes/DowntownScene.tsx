"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  getFacadeTextures,
  makeAsphaltTexture,
  makeConcreteTexture,
} from "../textures";

function Building({
  position,
  size,
  facade,
  accent,
}: {
  position: [number, number, number];
  size: [number, number, number];
  facade: THREE.Texture;
  accent: string;
}) {
  const [w, h, d] = size;
  const map = useMemo(() => {
    const t = facade.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(w / 2.2)), Math.max(1, Math.round(h / 3)));
    return t;
  }, [facade, w, h]);

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
      {/* Rooftop mechanicals */}
      <mesh castShadow position={[w * 0.2, h + 0.12, -d * 0.15]}>
        <boxGeometry args={[w * 0.3, 0.24, d * 0.3]} />
        <meshStandardMaterial color="#262e38" roughness={0.9} />
      </mesh>
      <mesh position={[-w * 0.25, h + 0.2, d * 0.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
        <meshStandardMaterial color="#3a424e" roughness={0.8} />
      </mesh>
      {/* Awning / storefront strip */}
      <mesh position={[0, 0.55, d / 2 + 0.12]}>
        <boxGeometry args={[w * 0.92, 0.08, 0.28]} />
        <meshStandardMaterial color={accent} roughness={0.5} emissive={accent} emissiveIntensity={0.12} />
      </mesh>
      {/* Glowing shop sign */}
      <mesh position={[0, 0.85, d / 2 + 0.03]}>
        <boxGeometry args={[w * 0.5, 0.14, 0.03]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.9}
          roughness={0.4}
        />
      </mesh>
      {/* Storefront glass */}
      <mesh position={[0, 0.25, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.7, 0.45, 0.04]} />
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

function Streetlight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.8, 6]} />
        <meshStandardMaterial color="#2c3440" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.35, 2.7, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.55, 0.04, 0.04]} />
        <meshStandardMaterial color="#2c3440" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.55, 2.55, 0]}>
        <boxGeometry args={[0.2, 0.08, 0.12]} />
        <meshStandardMaterial
          color="#f0e6c8"
          emissive="#f0d080"
          emissiveIntensity={1.1}
        />
      </mesh>
      <pointLight position={[0.55, 2.4, 0]} intensity={0.4} distance={6} color="#ffd9a0" />
    </group>
  );
}

function Car({
  position,
  color,
  rotation = 0,
}: {
  position: [number, number, number];
  color: string;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.28, 0]}>
        <boxGeometry args={[0.9, 0.28, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[0.05, 0.48, 0]}>
        <boxGeometry args={[0.45, 0.22, 0.38]} />
        <meshStandardMaterial color="#1a222c" metalness={0.6} roughness={0.15} />
      </mesh>
      {/* Headlights + taillights */}
      <mesh position={[0.46, 0.28, 0.13]}>
        <boxGeometry args={[0.02, 0.05, 0.08]} />
        <meshStandardMaterial color="#fff8d8" emissive="#ffedb0" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0.46, 0.28, -0.13]}>
        <boxGeometry args={[0.02, 0.05, 0.08]} />
        <meshStandardMaterial color="#fff8d8" emissive="#ffedb0" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[-0.46, 0.28, 0]}>
        <boxGeometry args={[0.02, 0.05, 0.3]} />
        <meshStandardMaterial color="#a02020" emissive="#e03030" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

export function DowntownScene() {
  const facades = useMemo(() => getFacadeTextures(), []);
  const asphalt = useMemo(() => {
    const t = makeAsphaltTexture();
    t.repeat.set(3, 13);
    return t;
  }, []);
  const concrete = useMemo(() => {
    const t = makeConcreteTexture();
    t.repeat.set(1.2, 18);
    return t;
  }, []);

  const buildingsL = useMemo(
    () =>
      [
        { z: 6, h: 4.2, w: 2.2, f: 0, a: "#3ec7c0" },
        { z: 2.5, h: 5.5, w: 2.6, f: 1, a: "#e07050" },
        { z: -1, h: 3.6, w: 2.0, f: 2, a: "#6a9fd0" },
        { z: -4.5, h: 6.2, w: 2.8, f: 3, a: "#d4a05a" },
        { z: -8, h: 4.8, w: 2.3, f: 0, a: "#5ec0b0" },
      ] as const,
    [],
  );
  const buildingsR = useMemo(
    () =>
      [
        { z: 7, h: 3.8, w: 2.1, f: 2, a: "#c07090" },
        { z: 3.5, h: 5.0, w: 2.4, f: 3, a: "#70b0d0" },
        { z: 0, h: 6.8, w: 2.7, f: 1, a: "#e8b060" },
        { z: -3.5, h: 4.0, w: 2.2, f: 0, a: "#50c0a0" },
        { z: -7, h: 5.6, w: 2.5, f: 2, a: "#8090c0" },
      ] as const,
    [],
  );

  return (
    <group>
      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[7, 28]} />
        <meshStandardMaterial map={asphalt} roughness={0.95} />
      </mesh>
      {/* Center dashes */}
      {[-9, -6, -3, 0, 3, 6, 9].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z - 1]}>
          <planeGeometry args={[0.12, 1.4]} />
          <meshStandardMaterial color="#d8c070" emissive="#806020" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {/* Crosswalk */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 5.2]}>
          <planeGeometry args={[0.35, 1.4]} />
          <meshStandardMaterial color="#c8ccd4" roughness={0.9} />
        </mesh>
      ))}
      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.03, -1]} receiveShadow>
        <planeGeometry args={[1.6, 28]} />
        <meshStandardMaterial map={concrete} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.2, 0.03, -1]} receiveShadow>
        <planeGeometry args={[1.6, 28]} />
        <meshStandardMaterial map={concrete} roughness={0.9} />
      </mesh>

      {buildingsL.map((b, i) => (
        <Building
          key={`l${i}`}
          position={[-4.6, 0, b.z]}
          size={[b.w, b.h, 2.4]}
          facade={facades[b.f]}
          accent={b.a}
        />
      ))}
      {buildingsR.map((b, i) => (
        <Building
          key={`r${i}`}
          position={[4.6, 0, b.z]}
          size={[b.w, b.h, 2.4]}
          facade={facades[b.f]}
          accent={b.a}
        />
      ))}

      <Streetlight position={[-2.6, 0, 4]} />
      <Streetlight position={[2.6, 0, 1]} />
      <Streetlight position={[-2.6, 0, -3]} />
      <Streetlight position={[2.6, 0, -7]} />

      <Car position={[-1.1, 0, 3]} color="#3a6a90" />
      <Car position={[1.2, 0, -2]} color="#8a4040" rotation={Math.PI} />
      <Car position={[-1.0, 0, -6]} color="#3a7050" />
    </group>
  );
}
