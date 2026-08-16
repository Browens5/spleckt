"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Drone } from "./Drone";
import { ScrollCamera } from "./ScrollCamera";
import { WorldScenes } from "./scenes/WorldScenes";
import { detectQuality, type QualityTier } from "./quality";
import { SCENES } from "./themes";
import { Dust, SkyDome } from "./effects";
import { sunState } from "./daylight";
import { FOCUS } from "./layout";

function SunRig({
  quality,
  progress,
}: {
  quality: QualityTier;
  progress: MutableRefObject<number>;
}) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sunColor = useRef(new THREE.Color("#6a80a0"));
  const fillColor = useRef(new THREE.Color("#80c0e0"));
  const hemiSky = useRef(new THREE.Color("#3a5070"));
  const hemiGnd = useRef(new THREE.Color("#1a1810"));

  useFrame(({ gl }) => {
    const t = progress.current;
    // Night in the city → sunrise as we leave → overhead by the neighborhood.
    const rise = THREE.MathUtils.smoothstep(t, 0.18, 0.4);
    const climb = THREE.MathUtils.smoothstep(t, 0.38, 0.76);
    const factor = THREE.MathUtils.clamp(rise * 0.4 + climb * 0.6, 0, 1);
    sunState.factor = factor;
    const elev = THREE.MathUtils.lerp(-0.08, 1.35, factor);
    sunState.elev = elev;

    const z = THREE.MathUtils.lerp(FOCUS.downtown.z, FOCUS.neighborhood.z, t);
    const x = Math.cos(elev) * 58;
    const y = Math.max(1.6, Math.sin(elev) * 72);
    const sz = z - Math.cos(elev) * 18;

    if (sun.current) {
      sun.current.position.set(x, y, sz);
      sun.current.target.position.set(0, 0, z);
      sun.current.target.updateMatrixWorld();
      if (factor < 0.12) {
        sunColor.current.set("#6a80a0");
        sun.current.intensity = 0.18;
      } else if (factor < 0.45) {
        sunColor.current.set("#ff8a3a");
        sun.current.intensity = THREE.MathUtils.lerp(0.55, 1.55, (factor - 0.12) / 0.33);
      } else {
        sunColor.current.set("#ffd0a0").lerp(fillColor.current.set("#fff6e0"), (factor - 0.45) / 0.55);
        sun.current.intensity = THREE.MathUtils.lerp(1.55, 2.15, (factor - 0.45) / 0.55);
      }
      sun.current.color.copy(sunColor.current);
    }

    if (fill.current) {
      fill.current.position.set(-18, 16, z - 8);
      fill.current.intensity = THREE.MathUtils.lerp(0.55, 0.22, factor);
      fillColor.current.set(factor < 0.3 ? "#80c0e0" : "#c8e0f0");
      fill.current.color.copy(fillColor.current);
    }
    if (ambient.current) {
      ambient.current.intensity = THREE.MathUtils.lerp(0.38, 1.05, factor);
    }
    if (hemi.current) {
      hemiSky.current.set(factor < 0.25 ? "#3a5070" : factor < 0.5 ? "#f0a060" : "#87c0e8");
      hemiGnd.current.set(factor < 0.35 ? "#1a1810" : "#4a6040");
      hemi.current.color.copy(hemiSky.current);
      hemi.current.groundColor.copy(hemiGnd.current);
      hemi.current.intensity = THREE.MathUtils.lerp(0.42, 0.85, factor);
    }

    gl.toneMappingExposure = THREE.MathUtils.lerp(1.02, 1.22, factor);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.38} />
      <directionalLight
        ref={sun}
        castShadow={quality.shadows}
        position={[18, 4, 6]}
        intensity={0.2}
        color="#6a80a0"
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
        shadow-camera-far={180}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <directionalLight ref={fill} position={[-12, 14, -20]} intensity={0.5} color="#80c0e0" />
      <hemisphereLight ref={hemi} args={["#3a5070", "#1a1810", 0.42]} />
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
      <fog attach="fog" args={[SCENES[0].fog, 32, 130]} />
    </>
  );
}

type CanvasProps = {
  progress: MutableRefObject<number>;
  lean: MutableRefObject<{ x: number; y: number; tx: number; ty: number }>;
  snapToken: MutableRefObject<number>;
};

export function DronesCanvas({ progress, lean, snapToken }: CanvasProps) {
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
      camera={{ fov: 42, near: 0.1, far: 420, position: [0, 3.4, 12] }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.setClearColor(SCENES[0].sky);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
    >
      <Atmosphere fogRef={fogRef} />
      <SkyDome progress={progress} />
      <SunRig quality={quality} progress={progress} />
      <ScrollCamera progress={progress} snapToken={snapToken} />
      <WorldScenes progress={progress} quality={quality} fogRef={fogRef} />
      {quality.density !== "low" ? <Dust /> : null}
      <Drone
        lean={lean}
        progress={progress}
        propDetail={quality.propDetail}
        reducedMotion={quality.reducedMotion}
      />
    </Canvas>
  );
}
