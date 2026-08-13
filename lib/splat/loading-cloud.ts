import type { PackedSplats } from "@sparkjsdev/spark";
import * as THREE from "three";

/**
 * Seed a volumetric gaussian cloud around the origin. Positions are in a
 * unit ball and scaled in the swirl shader by assemble radius.
 */
export function buildOriginCloud(
  splats: PackedSplats,
  count: number,
): void {
  const center = new THREE.Vector3();
  const scales = new THREE.Vector3(1.2, 1.2, 1.2);
  const quat = new THREE.Quaternion();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere + radial jitter so the cloud reads as volume, not a shell.
    const t = (i + 0.5) / count;
    const y = 1 - 2 * t;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = 2.399963229728653 * i;
    const radial = Math.cbrt(0.12 + 0.88 * ((i * 0.6180339887) % 1));
    center.set(
      Math.cos(theta) * r * radial,
      y * radial * 0.72,
      Math.sin(theta) * r * radial,
    );
    const warm = (i * 17) % 10 > 6;
    color.set(warm ? 0xe8c989 : 0x8ed4ea);
    splats.pushSplat(center, scales, quat, 0.85, color);
  }
}
