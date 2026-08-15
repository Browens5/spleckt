"use client";

import { useMemo } from "react";
import { makeAsphaltTexture, makeGrassTexture } from "../textures";
import { Car, FACE_NEG_Z, FACE_POS_Z, Streetlight, Tree } from "../kit";

/** Continuous street + roadside filler so districts read as one city. */
export function Corridor() {
  const asphalt = useMemo(() => {
    const t = makeAsphaltTexture(3);
    t.repeat.set(2, 40);
    return t;
  }, []);
  const grass = useMemo(() => {
    const t = makeGrassTexture(19);
    t.repeat.set(14, 36);
    return t;
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -44]} receiveShadow>
        <planeGeometry args={[56, 130]} />
        <meshStandardMaterial map={grass} color="#2a3328" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -44]} receiveShadow>
        <planeGeometry args={[7.2, 120]} />
        <meshStandardMaterial map={asphalt} roughness={0.95} />
      </mesh>
      {[-20, -24, -46, -50, -66, -70].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, z]}>
          <planeGeometry args={[0.1, 1.4]} />
          <meshStandardMaterial color="#d8c070" emissive="#806020" emissiveIntensity={0.2} />
        </mesh>
      ))}

      {/* Lights only in the seams — districts already have their own. */}
      <Streetlight position={[-2.6, 0, -21]} />
      <Streetlight position={[2.6, 0, -23]} rotation={Math.PI} />
      <Streetlight position={[-2.6, 0, -47]} />
      <Streetlight position={[2.6, 0, -49]} rotation={Math.PI} />
      <Streetlight position={[-2.6, 0, -67]} />
      <Streetlight position={[2.6, 0, -71]} rotation={Math.PI} />

      {/* Downtown → jobsite seam */}
      <Tree position={[-3.6, 0, -21]} scale={0.8} />
      <Tree position={[3.8, 0, -23]} scale={0.7} />
      <Car position={[1.15, 0, -22]} color="#4a6078" rotation={FACE_NEG_Z} />

      {/* Jobsite → survey seam */}
      <Tree position={[-4.2, 0, -46]} scale={0.75} />
      <Tree position={[4.0, 0, -48]} scale={0.85} />
      <Tree position={[-3.4, 0, -50]} scale={0.65} />

      {/* Survey → neighborhood seam */}
      <Tree position={[-3.8, 0, -68]} scale={0.9} />
      <Tree position={[3.6, 0, -70]} scale={0.8} />
      <Tree position={[-4.0, 0, -72]} scale={0.7} />
      <Car position={[-1.15, 0, -69]} color="#6a5040" rotation={FACE_POS_Z} />
    </group>
  );
}
