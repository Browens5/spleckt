"use client";

import { useMemo } from "react";

function Building({
  position,
  size,
  color,
  accent,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  accent: string;
}) {
  const [w, h, d] = size;
  const windows = useMemo(() => {
    const items: { pos: [number, number, number]; lit: boolean }[] = [];
    const cols = Math.max(2, Math.floor(w * 2.2));
    const rows = Math.max(2, Math.floor(h * 1.6));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          pos: [
            -w / 2 + 0.35 + (c / Math.max(1, cols - 1)) * (w - 0.7),
            0.4 + (r / Math.max(1, rows - 1)) * (h - 0.9),
            d / 2 + 0.02,
          ],
          lit: (r * 3 + c) % 5 !== 0,
        });
      }
    }
    return items;
  }, [w, h, d]);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.08} />
      </mesh>
      {/* Awning / storefront */}
      <mesh position={[0, 0.55, d / 2 + 0.12]}>
        <boxGeometry args={[w * 0.92, 0.08, 0.28]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.25, d / 2 + 0.01]}>
        <boxGeometry args={[w * 0.7, 0.45, 0.04]} />
        <meshStandardMaterial color="#0d1218" metalness={0.4} roughness={0.3} />
      </mesh>
      {windows.map((win, i) => (
        <mesh key={i} position={win.pos}>
          <boxGeometry args={[0.18, 0.22, 0.04]} />
          <meshStandardMaterial
            color={win.lit ? "#c9e8ff" : "#1a2430"}
            emissive={win.lit ? "#6aa8d0" : "#000000"}
            emissiveIntensity={win.lit ? 0.55 : 0}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function Streetlight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.8, 6]} />
        <meshStandardMaterial color="#2c3440" />
      </mesh>
      <mesh position={[0.35, 2.7, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.55, 0.04, 0.04]} />
        <meshStandardMaterial color="#2c3440" />
      </mesh>
      <mesh position={[0.55, 2.55, 0]}>
        <boxGeometry args={[0.2, 0.08, 0.12]} />
        <meshStandardMaterial
          color="#f0e6c8"
          emissive="#f0d080"
          emissiveIntensity={0.8}
        />
      </mesh>
      <pointLight position={[0.55, 2.4, 0]} intensity={0.35} distance={6} color="#ffd9a0" />
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
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh castShadow position={[0.05, 0.48, 0]}>
        <boxGeometry args={[0.45, 0.22, 0.38]} />
        <meshStandardMaterial color="#1a222c" metalness={0.5} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function DowntownScene() {
  const buildingsL = useMemo(
    () =>
      [
        { z: 6, h: 4.2, w: 2.2, c: "#2a3544", a: "#3ec7c0" },
        { z: 2.5, h: 5.5, w: 2.6, c: "#243040", a: "#e07050" },
        { z: -1, h: 3.6, w: 2.0, c: "#2e3a48", a: "#6a9fd0" },
        { z: -4.5, h: 6.2, w: 2.8, c: "#1f2a36", a: "#d4a05a" },
        { z: -8, h: 4.8, w: 2.3, c: "#273442", a: "#5ec0b0" },
      ] as const,
    [],
  );
  const buildingsR = useMemo(
    () =>
      [
        { z: 7, h: 3.8, w: 2.1, c: "#263240", a: "#c07090" },
        { z: 3.5, h: 5.0, w: 2.4, c: "#2c3848", a: "#70b0d0" },
        { z: 0, h: 6.8, w: 2.7, c: "#1e2834", a: "#e8b060" },
        { z: -3.5, h: 4.0, w: 2.2, c: "#2a3644", a: "#50c0a0" },
        { z: -7, h: 5.6, w: 2.5, c: "#24303c", a: "#8090c0" },
      ] as const,
    [],
  );

  return (
    <group>
      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[7, 28]} />
        <meshStandardMaterial color="#1a1f26" roughness={0.95} />
      </mesh>
      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1]}>
        <planeGeometry args={[0.12, 26]} />
        <meshStandardMaterial color="#d8c070" emissive="#806020" emissiveIntensity={0.2} />
      </mesh>
      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.03, -1]} receiveShadow>
        <planeGeometry args={[1.6, 28]} />
        <meshStandardMaterial color="#3a424c" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.2, 0.03, -1]} receiveShadow>
        <planeGeometry args={[1.6, 28]} />
        <meshStandardMaterial color="#3a424c" roughness={0.9} />
      </mesh>

      {buildingsL.map((b, i) => (
        <Building
          key={`l${i}`}
          position={[-4.6, 0, b.z]}
          size={[b.w, b.h, 2.4]}
          color={b.c}
          accent={b.a}
        />
      ))}
      {buildingsR.map((b, i) => (
        <Building
          key={`r${i}`}
          position={[4.6, 0, b.z]}
          size={[b.w, b.h, 2.4]}
          color={b.c}
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
