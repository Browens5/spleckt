"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENES } from "./themes";
import { sunState } from "./daylight";

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
    vec3 col = mix(uHorizon, uTop, smoothstep(-0.12, 0.62, h));

    // Keep the dome readable as dusk, never a crushed black void
    col += vec3(0.055, 0.06, 0.075);

    // Wide horizon band
    float glow = exp(-abs(h - 0.05) * 8.0) * 0.55;
    col += uHorizon * glow;

    // Below-horizon wash so open views still have ground-colored sky
    if (h < 0.02) {
      col = mix(col, uHorizon * 1.35, smoothstep(0.02, -0.22, h) * 0.65);
    }

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

const SKY_KEYS = [
  { t: 0, top: "#152238", horizon: "#1a3048", star: 1 },
  { t: 0.2, top: "#24344e", horizon: "#c06838", star: 0.35 },
  { t: 0.36, top: "#4a6088", horizon: "#e09050", star: 0.06 },
  { t: 0.58, top: "#5a98c8", horizon: "#f0c8a0", star: 0 },
  { t: 1, top: "#4aa4e4", horizon: "#d0e4f0", star: 0 },
] as const;

function sampleSky(t: number, top: THREE.Color, horizon: THREE.Color) {
  const x = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < SKY_KEYS.length - 2 && x > SKY_KEYS[i + 1].t) i += 1;
  const a = SKY_KEYS[i];
  const b = SKY_KEYS[i + 1];
  const u = THREE.MathUtils.smoothstep(x, a.t, b.t);
  top.set(a.top).lerp(new THREE.Color(b.top), u);
  horizon.set(a.horizon).lerp(new THREE.Color(b.horizon), u);
  return THREE.MathUtils.lerp(a.star, b.star, u);
}

export function SkyDome({
  progress,
}: {
  progress?: MutableRefObject<number>;
}) {
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
    const t = progress?.current ?? sunState.factor;
    const starTarget = sampleSky(t, target.current.top, target.current.horizon);

    const u = mat.uniforms;
    (u.uTop.value as THREE.Color).lerp(target.current.top, 0.08);
    (u.uHorizon.value as THREE.Color).lerp(target.current.horizon, 0.08);
    u.uStar.value += (starTarget - (u.uStar.value as number)) * 0.06;
    u.uTime.value = state.clock.elapsedTime;

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
