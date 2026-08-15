"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENES } from "./themes";

const STAR_INTENSITY: Record<string, number> = {
  downtown: 1.0,
  construction: 0.35,
  ortho: 0.55,
  neighborhood: 0.45,
};

const SKY_VERT = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  varying vec3 vWorldPosition;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform float uStar;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 dir = normalize(vWorldPosition - cameraPosition);
    float h = clamp(dir.y, -1.0, 1.0);
    vec3 col = mix(uHorizon, uTop, smoothstep(-0.06, 0.55, h));

    // Ambient sky lift so the zenith never crushes to pure black
    col += vec3(0.012, 0.018, 0.028);

    // Horizon glow band
    float glow = exp(-abs(h - 0.02) * 14.0) * 0.3;
    col += uHorizon * glow;

    // Stars with subtle twinkle
    if (dir.y > 0.08) {
      vec2 sp = dir.xz / max(0.15, dir.y) * 17.0;
      vec2 cell = floor(sp);
      float rnd = hash(cell);
      if (rnd > 0.962) {
        vec2 f = fract(sp) - 0.5;
        float d = length(f);
        float tw = 0.7 + 0.3 * sin(uTime * (1.5 + rnd * 3.0) + rnd * 40.0);
        float star = smoothstep(0.16, 0.0, d) * smoothstep(0.08, 0.4, dir.y);
        col += star * tw * uStar * 1.6 * vec3(0.78, 0.87, 1.0);
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SkyDome() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(SCENES[0].sky) },
      uHorizon: { value: new THREE.Color(SCENES[0].fog) },
      uStar: { value: 1 },
      uTime: { value: 0 },
    }),
    [],
  );
  const target = useRef({
    top: new THREE.Color(SCENES[0].sky),
    horizon: new THREE.Color(SCENES[0].fog),
  });

  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mat = material.current;
    if (!mat) return;
    const root = document.querySelector(".drones-experience");
    const themeId = root?.getAttribute("data-scene") ?? "downtown";
    const theme = SCENES.find((s) => s.id === themeId) ?? SCENES[0];
    const t = target.current;
    t.top.set(theme.sky);
    t.horizon.set(theme.fog);

    const u = mat.uniforms;
    (u.uTop.value as THREE.Color).lerp(t.top, 0.05);
    (u.uHorizon.value as THREE.Color).lerp(t.horizon, 0.05);
    const starTarget = STAR_INTENSITY[themeId] ?? 0.5;
    u.uStar.value += (starTarget - (u.uStar.value as number)) * 0.05;
    u.uTime.value = state.clock.elapsedTime;

    // Stay around the camera so later districts never fly out of the sky.
    if (mesh.current) mesh.current.position.copy(state.camera.position);
  });

  return (
    <mesh ref={mesh} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[240, 24, 16]} />
      <shaderMaterial
        ref={material}
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

const SCAN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCAN_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;

  void main() {
    // Survey grid
    vec2 g = abs(fract(vUv * 34.0) - 0.5);
    float grid = (1.0 - smoothstep(0.0, 0.05, min(g.x, g.y))) * 0.28;
    vec2 gm = abs(fract(vUv * 8.5) - 0.5);
    float major = (1.0 - smoothstep(0.0, 0.025, min(gm.x, gm.y))) * 0.35;

    // Expanding scan pulse
    float d = distance(vUv, vec2(0.5));
    float t = fract(uTime * 0.11);
    float ring = (1.0 - smoothstep(0.0, 0.025, abs(d - t * 0.62))) * (1.0 - t);

    // Rotating sweep line
    vec2 p = vUv - 0.5;
    float ang = atan(p.y, p.x);
    float sweep = pow(max(0.0, cos(ang - uTime * 0.5)), 24.0) * 0.3 * smoothstep(0.5, 0.1, d);

    float edge = smoothstep(0.5, 0.4, d);
    float a = (grid + major + ring * 0.85 + sweep) * edge * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;

function fadeWindow(t: number, start: number, end: number, feather: number) {
  const rise = Math.min(1, Math.max(0, (t - start) / feather));
  const fall = Math.min(1, Math.max(0, (end - t) / feather));
  return Math.min(rise, fall);
}

export function ScanGrid({
  size,
  color,
  position,
  progress,
  window: fadeRange = [0.45, 0.82],
}: {
  size: number;
  color: string;
  position: [number, number, number];
  progress: { current: number };
  window?: [number, number];
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color],
  );

  useFrame((state) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uOpacity.value = fadeWindow(
      progress.current,
      fadeRange[0],
      fadeRange[1],
      0.06,
    );
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} renderOrder={2}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        ref={material}
        vertexShader={SCAN_VERT}
        fragmentShader={SCAN_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/** Slow-drifting atmospheric dust motes along the flight path. */
export function Dust({ count = 260 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const rand = (i: number) => {
      const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand(i) - 0.5) * 28;
      positions[i * 3 + 1] = rand(i + count) * 12 + 0.4;
      positions[i * 3 + 2] = rand(i + count * 2) * -110 + 12;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current || !material.current) return;
    points.current.rotation.y += delta * 0.012;
    material.current.opacity =
      0.3 + Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        ref={material}
        color="#9fd8e0"
        size={0.06}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
