"use client";

import { useMemo } from "react";
import { makeConcreteTexture, makeDirtTexture } from "../textures";

function Scaffold({
  position,
  floors,
}: {
  position: [number, number, number];
  floors: number;
}) {
  const bars = useMemo(() => {
    const items: { pos: [number, number, number]; rot?: [number, number, number]; size: [number, number, number] }[] = [];
    for (let f = 0; f < floors; f++) {
      const y = f * 1.1 + 0.55;
      items.push({ pos: [-1.4, y, 0], size: [0.06, 1.1, 0.06] });
      items.push({ pos: [1.4, y, 0], size: [0.06, 1.1, 0.06] });
      items.push({ pos: [-1.4, y, 2.2], size: [0.06, 1.1, 0.06] });
      items.push({ pos: [1.4, y, 2.2], size: [0.06, 1.1, 0.06] });
      items.push({ pos: [0, y + 0.5, 0], size: [2.9, 0.05, 0.05] });
      items.push({ pos: [0, y + 0.5, 2.2], size: [2.9, 0.05, 0.05] });
      items.push({
        pos: [-1.4, y + 0.2, 1.1],
        rot: [0, 0, 0.55],
        size: [0.04, 1.6, 0.04],
      });
      items.push({
        pos: [1.4, y + 0.2, 1.1],
        rot: [0, 0, -0.55],
        size: [0.04, 1.6, 0.04],
      });
    }
    return items;
  }, [floors]);

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

function Crane({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 4, 0]}>
        <boxGeometry args={[0.35, 8, 0.35]} />
        <meshStandardMaterial color="#d8a040" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[2.2, 7.8, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[5.2, 0.22, 0.28]} />
        <meshStandardMaterial color="#e0b050" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[4.5, 6.2, 0]}>
        <boxGeometry args={[0.04, 3.2, 0.04]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      <mesh position={[4.5, 4.5, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-1.2, 7.6, 0]}>
        <boxGeometry args={[0.9, 0.7, 0.7]} />
        <meshStandardMaterial color="#2a3038" />
      </mesh>
      {/* Aviation beacon */}
      <mesh position={[0, 8.15, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff4030" emissive="#ff2020" emissiveIntensity={2.2} />
      </mesh>
    </group>
  );
}

export function ConstructionScene() {
  const dirt = useMemo(() => {
    const t = makeDirtTexture();
    t.repeat.set(5, 4.5);
    return t;
  }, []);
  const concrete = useMemo(() => {
    const t = makeConcreteTexture(13);
    t.repeat.set(3, 3.2);
    return t;
  }, []);

  return (
    <group position={[2.5, 0, -13]}>
      {/* Dirt pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[18, 16]} />
        <meshStandardMaterial map={dirt} roughness={1} />
      </mesh>

      {/* Core building under construction */}
      <mesh castShadow receiveShadow position={[0, 2.4, 0]}>
        <boxGeometry args={[4.2, 4.8, 3.6]} />
        <meshStandardMaterial map={concrete} color="#cabfa8" roughness={0.9} />
      </mesh>
      {/* Warm work lights glowing inside open floors */}
      {[0.9, 2.1, 3.3].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 1.82]}>
            <boxGeometry args={[3.6, 0.5, 0.03]} />
            <meshStandardMaterial
              color="#3a2c18"
              emissive="#ffb860"
              emissiveIntensity={0.5}
              roughness={0.9}
            />
          </mesh>
          <mesh position={[2.12, y, 0]}>
            <boxGeometry args={[0.03, 0.5, 3.0]} />
            <meshStandardMaterial
              color="#3a2c18"
              emissive="#ffb860"
              emissiveIntensity={0.35}
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}
      {/* Floor plates */}
      {[1.2, 2.4, 3.6].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[4.4, 0.12, 3.8]} />
          <meshStandardMaterial color="#6a6860" />
        </mesh>
      ))}
      {/* Rebar stubs on roof */}
      {[-1.2, -0.4, 0.4, 1.2].map((x) =>
        [-0.8, 0.8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 5.1, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 5]} />
            <meshStandardMaterial color="#a0a8b0" metalness={0.7} roughness={0.3} />
          </mesh>
        )),
      )}

      <Scaffold position={[-2.6, 0, -1.2]} floors={4} />
      <Scaffold position={[2.6, 0, -1.2]} floors={3} />
      <Crane position={[5.5, 0, 2]} />

      {/* Material stacks */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[-5.5, 0.25 + i * 0.22, 3 + i * 0.1]}>
          <boxGeometry args={[1.4, 0.2, 0.7]} />
          <meshStandardMaterial color="#c05030" roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[4, 0.4, 4]}>
        <boxGeometry args={[1.8, 0.8, 1.2]} />
        <meshStandardMaterial color="#406080" roughness={0.6} />
      </mesh>

      {/* Barriers */}
      {[-4, -2, 0, 2, 4].map((x) => (
        <mesh key={x} position={[x, 0.45, 6.5]}>
          <boxGeometry args={[1.6, 0.9, 0.18]} />
          <meshStandardMaterial color={x % 4 === 0 ? "#e8c040" : "#2a2a2a"} />
        </mesh>
      ))}

      {/* Excavator-ish silhouette */}
      <group position={[-6, 0, -3]}>
        <mesh castShadow position={[0, 0.45, 0]}>
          <boxGeometry args={[1.6, 0.7, 1.1]} />
          <meshStandardMaterial color="#d07020" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[1.2, 1.1, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[1.8, 0.18, 0.18]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[2.1, 0.5, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.5]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </group>

      {/* Floodlight tower washing the site in warm work light */}
      <group position={[6.5, 0, -4]}>
        <mesh castShadow position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 3.2, 6]} />
          <meshStandardMaterial color="#3a4048" />
        </mesh>
        <mesh position={[0, 3.25, 0]} rotation={[0.5, -0.8, 0]}>
          <boxGeometry args={[0.5, 0.3, 0.15]} />
          <meshStandardMaterial color="#f5e8c8" emissive="#ffe0a0" emissiveIntensity={1.8} />
        </mesh>
        <pointLight position={[0, 3, 0]} intensity={0.9} distance={14} color="#ffd9a0" />
      </group>
    </group>
  );
}
