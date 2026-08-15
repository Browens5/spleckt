"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Drone } from "./Drone";
import { ScrollCamera } from "./ScrollCamera";
import { WorldScenes } from "./scenes/WorldScenes";
import { detectQuality, type QualityTier } from "./quality";
import { SCENES } from "./themes";

function Lights({ quality }: { quality: QualityTier }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow={quality.shadows}
        position={[8, 14, 6]}
        intensity={1.15}
        color="#fff2e0"
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
        shadow-camera-far={40}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.35} color="#80c0e0" />
      <hemisphereLight args={["#8ab0c8", "#1a1810", 0.4]} />
    </>
  );
}

function Atmosphere({
  fogRef,
}: {
  fogRef: MutableRefObject<THREE.FogExp2 | THREE.Fog | null>;
}) {
  const { scene } = useThree();
  const skyTarget = useRef(new THREE.Color(SCENES[0].sky));

  useFrame(() => {
    const root = document.querySelector(".drones-experience");
    const theme = root?.getAttribute("data-scene");
    const sceneTheme = SCENES.find((s) => s.id === theme) ?? SCENES[0];
    skyTarget.current.set(sceneTheme.sky);

    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(skyTarget.current, 0.06);
    }
    if (scene.fog && !fogRef.current) {
      fogRef.current = scene.fog as THREE.Fog;
    }
  });

  return (
    <>
      <color attach="background" args={[SCENES[0].sky]} />
      <fog attach="fog" args={[SCENES[0].fog, 8, 32]} />
    </>
  );
}

type CanvasProps = {
  progress: MutableRefObject<number>;
  lean: MutableRefObject<{ x: number; y: number; tx: number; ty: number }>;
};

export function DronesCanvas({ progress, lean }: CanvasProps) {
  const quality = useMemo(() => detectQuality(), []);
  const fogRef = useRef<THREE.Fog | null>(null);

  return (
    <Canvas
      className="drones-canvas"
      dpr={[1, quality.dprMax]}
      frameloop="always"
      gl={{
        antialias: quality.density !== "low",
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
      }}
      shadows={quality.shadows}
      camera={{ fov: 42, near: 0.1, far: 80, position: [0, 3.2, 8.5] }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.setClearColor(SCENES[0].sky);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Atmosphere fogRef={fogRef} />
      <Lights quality={quality} />
      <ScrollCamera progress={progress} />
      <WorldScenes progress={progress} quality={quality} fogRef={fogRef} />
      <Drone
        lean={lean}
        progress={progress}
        propDetail={quality.propDetail}
        reducedMotion={quality.reducedMotion}
      />
    </Canvas>
  );
}
