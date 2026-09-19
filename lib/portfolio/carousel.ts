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

export const CARD_RADIUS = 4.05;
export const CARD_Y = 1.28;
export const DECK_RADIUS = 5.05;

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
    return { x: 0, y: CARD_Y, z: CARD_RADIUS, yaw: 0, scale: 1, delta: 0 };
  }

  const delta = wrapDelta(index - selected, count);
  const spacing = count <= 3 ? 0.5 : count <= 5 ? 0.4 : 0.3;
  const angle = delta * spacing;

  return {
    x: Math.sin(angle) * CARD_RADIUS,
    y: CARD_Y,
    z: Math.cos(angle) * CARD_RADIUS,
    yaw: (angle * 180) / Math.PI * 0.55,
    scale: 1.08 - Math.min(0.28, Math.abs(delta) * 0.12),
    delta,
  };
}
