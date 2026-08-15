"use client";

import { useMemo } from "react";
import { makeConcreteTexture, makeDirtTexture } from "../textures";
import { ANCHOR } from "../layout";

function Scaffold({
  position,
  floors,
  width = 2.8,
  depth = 2.2,
}: {
  position: [number, number, number];
  floors: number;
  width?: number;
  depth?: number;
}) {
  const bars = useMemo(() => {
    const items: {
      pos: [number, number, number];
      rot?: [number, number, number];
      size: [number, number, number];
    }[] = [];
    const hx = width / 2;
    const hz = depth / 2;
    for (let f = 0; f < floors; f++) {
      const y = f * 1.15 + 0.55;
      for (const [x, z] of [
        [-hx, -hz],
        [hx, -hz],
        [-hx, hz],
        [hx, hz],
      ] as const) {
        items.push({ pos: [x, y, z], size: [0.06, 1.15, 0.06] });
      }
      items.push({ pos: [0, y + 0.52, -hz], size: [width, 0.05, 0.05] });
      items.push({ pos: [0, y + 0.52, hz], size: [width, 0.05, 0.05] });
      items.push({ pos: [-hx, y + 0.52, 0], size: [0.05, 0.05, depth] });
      items.push({ pos: [hx, y + 0.52, 0], size: [0.05, 0.05, depth] });
      items.push({
        pos: [-hx, y + 0.2, 0],
        rot: [0, 0, 0.55],
        size: [0.04, 1.5, 0.04],
      });
      items.push({
        pos: [hx, y + 0.2, 0],
        rot: [0, 0, -0.55],
        size: [0.04, 1.5, 0.04],
      });
    }
    return items;
  }, [floors, width, depth]);

  return (
    <group position={position}>
      {bars.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={b.rot ?? [0, 0, 0]} castShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color="#c07030" metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Crane({
  position,
  rotation = 0,
  height = 9,
}: {
  position: [number, number, number];
  rotation?: number;
  height?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[0.38, height, 0.38]} />
        <meshStandardMaterial color="#d8a040" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[2.6, height - 0.25, 0]}>
        <boxGeometry args={[6.2, 0.24, 0.3]} />
        <meshStandardMaterial color="#e0b050" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[5.4, height - 2.2, 0]}>
        <boxGeometry args={[0.04, 3.6, 0.04]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      <mesh position={[5.4, height - 4.1, 0]}>
        <boxGeometry args={[0.55, 0.4, 0.55]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-1.4, height - 0.45, 0]}>
        <boxGeometry args={[1.0, 0.75, 0.75]} />
        <meshStandardMaterial color="#2a3038" />
      </mesh>
      <mesh position={[0, height + 0.18, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#ff4030" emissive="#ff2020" emissiveIntensity={2.4} />
      </mesh>
    </group>
  );
}

export function ConstructionScene() {
  const dirt = useMemo(() => {
    const t = makeDirtTexture();
    t.repeat.set(7, 6);
    return t;
  }, []);
  const concrete = useMemo(() => {
    const t = makeConcreteTexture(13);
    t.repeat.set(3.4, 3.6);
    return t;
  }, []);

  return (
    <group position={[ANCHOR.construction.x, 0, ANCHOR.construction.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[28, 24]} />
        <meshStandardMaterial map={dirt} roughness={1} />
      </mesh>

      {/* Approach road stub so the flight out of downtown lands on site */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]}>
        <planeGeometry args={[6, 8]} />
        <meshStandardMaterial color="#2a3038" roughness={0.95} />
      </mesh>

      {/* Primary tower */}
      <mesh castShadow receiveShadow position={[0, 3.2, 0]}>
        <boxGeometry args={[5.2, 6.4, 4.4]} />
        <meshStandardMaterial map={concrete} color="#cabfa8" roughness={0.9} />
      </mesh>
      {[1.4, 2.8, 4.2, 5.6].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[5.4, 0.12, 4.6]} />
          <meshStandardMaterial color="#6a6860" />
        </mesh>
      ))}
      {[1.1, 2.5, 3.9, 5.3].map((y) => (
        <group key={`glow${y}`}>
          <mesh position={[0, y, 2.22]}>
            <boxGeometry args={[4.6, 0.55, 0.03]} />
            <meshStandardMaterial color="#3a2c18" emissive="#ffb860" emissiveIntensity={0.55} roughness={0.9} />
          </mesh>
          <mesh position={[2.62, y, 0]}>
            <boxGeometry args={[0.03, 0.55, 3.6]} />
            <meshStandardMaterial color="#3a2c18" emissive="#ffb860" emissiveIntensity={0.4} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-1.6, -0.5, 0.5, 1.6].map((x) =>
        [-1.1, 1.1].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 6.7, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 5]} />
            <meshStandardMaterial color="#a0a8b0" metalness={0.7} roughness={0.3} />
          </mesh>
        )),
      )}

      {/* Second, lower building */}
      <mesh castShadow receiveShadow position={[-8, 1.6, -4]}>
        <boxGeometry args={[4.0, 3.2, 3.4]} />
        <meshStandardMaterial map={concrete} color="#b8b09c" roughness={0.92} />
      </mesh>
      {[1.1, 2.2].map((y) => (
        <mesh key={`b2${y}`} position={[-8, y, -4]}>
          <boxGeometry args={[4.2, 0.1, 3.6]} />
          <meshStandardMaterial color="#6a6860" />
        </mesh>
      ))}

      <Scaffold position={[-3.2, 0, -1.4]} floors={5} width={3.0} depth={2.4} />
      <Scaffold position={[3.2, 0, -1.4]} floors={4} width={3.0} depth={2.4} />
      <Scaffold position={[-8, 0, -6.2]} floors={3} width={2.4} depth={2.0} />
      <Crane position={[7.2, 0, 3]} rotation={-0.4} height={10} />
      <Crane position={[-11, 0, 2]} rotation={1.1} height={7.5} />

      {/* Brick pallets */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} castShadow position={[-6.5, 0.22 + i * 0.2, 6 + i * 0.05]}>
          <boxGeometry args={[1.5, 0.18, 0.75]} />
          <meshStandardMaterial color="#c05030" roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[5.5, 0.45, 7]}>
        <boxGeometry args={[2.0, 0.9, 1.3]} />
        <meshStandardMaterial color="#406080" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[7.2, 0.55, 6.6]}>
        <boxGeometry args={[1.2, 1.1, 1.1]} />
        <meshStandardMaterial color="#355070" roughness={0.6} />
      </mesh>

      {/* Site fence */}
      {[-10, -6, -2, 2, 6, 10].map((x) => (
        <mesh key={`f${x}`} position={[x, 0.55, 11.2]}>
          <boxGeometry args={[3.6, 1.1, 0.08]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      ))}
      {[-10, -6, -2, 2, 6, 10].map((x, i) => (
        <mesh key={`b${x}`} position={[x, 0.5, 11.35]}>
          <boxGeometry args={[1.5, 0.85, 0.1]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#e8c040" : "#2a2a2a"} />
        </mesh>
      ))}

      {/* Excavator */}
      <group position={[-9, 0, 4]} rotation={[0, 0.6, 0]}>
        <mesh castShadow position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 1.6, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[1.7, 0.7, 1.15]} />
          <meshStandardMaterial color="#d07020" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.15, 1.15, 0.15]}>
          <boxGeometry args={[0.7, 0.55, 0.7]} />
          <meshStandardMaterial color="#2a3038" />
        </mesh>
        <mesh position={[1.3, 1.15, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[1.9, 0.16, 0.16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[2.3, 0.55, 0]}>
          <boxGeometry args={[0.45, 0.55, 0.55]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </group>

      {/* Dumpster + porta */}
      <mesh castShadow position={[9.5, 0.55, -6]}>
        <boxGeometry args={[2.2, 1.1, 1.3]} />
        <meshStandardMaterial color="#3a6a40" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[11.4, 0.7, -3.5]}>
        <boxGeometry args={[1.0, 1.4, 1.0]} />
        <meshStandardMaterial color="#d8d0b8" roughness={0.8} />
      </mesh>

      <group position={[9.2, 0, -8]}>
        <mesh castShadow position={[0, 1.7, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 3.4, 6]} />
          <meshStandardMaterial color="#3a4048" />
        </mesh>
        <mesh position={[0, 3.4, 0]} rotation={[0.55, -0.7, 0]}>
          <boxGeometry args={[0.55, 0.32, 0.16]} />
          <meshStandardMaterial color="#f5e8c8" emissive="#ffe0a0" emissiveIntensity={1.8} />
        </mesh>
        <pointLight position={[0, 3.1, 0]} intensity={1.0} distance={16} color="#ffd9a0" />
      </group>
      <group position={[-12, 0, -7]}>
        <mesh castShadow position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 3.0, 6]} />
          <meshStandardMaterial color="#3a4048" />
        </mesh>
        <mesh position={[0, 3.05, 0]} rotation={[0.4, 0.9, 0]}>
          <boxGeometry args={[0.5, 0.3, 0.15]} />
          <meshStandardMaterial color="#f5e8c8" emissive="#ffe0a0" emissiveIntensity={1.6} />
        </mesh>
        <pointLight position={[0, 2.8, 0]} intensity={0.7} distance={12} color="#ffd9a0" />
      </group>
    </group>
  );
}
