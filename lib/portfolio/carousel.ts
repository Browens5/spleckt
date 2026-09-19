export function wrapDelta(delta: number, count: number) {
  if (count <= 0) return 0;
  let value = delta;
  while (value > count / 2) value -= count;
  while (value < -count / 2) value += count;
  return value;
}

export function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

export function nearestIndex(value: number, count: number) {
  if (count <= 0) return 0;
  return wrapIndex(Math.round(value), count);
}

export type CarouselSlot = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  delta: number;
};

export function carouselSlot(
  index: number,
  selected: number,
  count: number,
): CarouselSlot {
  if (count <= 0) {
    return { x: 0, y: 1.22, z: 0.35, yaw: 0, scale: 1, delta: 0 };
  }

  const delta = wrapDelta(index - selected, count);
  const spacing = count <= 3 ? 0.46 : count <= 5 ? 0.38 : 0.3;
  const angle = delta * spacing;
  const radius = 4.55;

  return {
    x: Math.sin(angle) * radius,
    y: 1.22 + Math.abs(delta) * 0.02,
    z: Math.cos(angle) * 1.55 - 1.15,
    yaw: angle * (180 / Math.PI) * 0.42,
    scale: 1.08 - Math.min(0.42, Math.abs(delta) * 0.14),
    delta,
  };
}
