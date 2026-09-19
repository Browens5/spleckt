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

export type WheelNavState = {
  leftover: number;
  lastEventAt: number;
  lastStepAt: number;
  armed: boolean;
};

export function createWheelNavState(): WheelNavState {
  return { leftover: 0, lastEventAt: 0, lastStepAt: 0, armed: true };
}

function wheelPrimary(
  event: { deltaX: number; deltaY: number; deltaMode: number },
): number {
  const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 600 : 1;
  const dx = event.deltaX * scale;
  const dy = event.deltaY * scale;
  if (dx === 0 && dy === 0) return 0;
  return Math.abs(dx) > Math.abs(dy) * 1.15 ? dx : dy;
}

/** Mouse / notch wheels send large, regular deltas. Trackpads send a flood of small ones. */
function isNotchDelta(delta: number, deltaMode: number): boolean {
  if (deltaMode !== 0) return true;
  const abs = Math.abs(delta);
  if (abs < 80) return false;
  const snapped = Math.round(abs / 40) * 40;
  return Math.abs(abs - snapped) < 0.01;
}

/**
 * One card per trackpad flick, one card per mouse-wheel notch.
 * Inertia after a flick is ignored until the gesture settles.
 */
export function wheelStep(
  state: WheelNavState,
  event: { deltaX: number; deltaY: number; deltaMode: number },
  now: number,
  options?: { threshold?: number; settleMs?: number; cooldownMs?: number },
): -1 | 0 | 1 {
  const threshold = options?.threshold ?? 48;
  const settleMs = options?.settleMs ?? 180;
  const cooldownMs = options?.cooldownMs ?? 160;

  const primary = wheelPrimary(event);
  if (primary === 0) return 0;

  if (now - state.lastEventAt > settleMs) {
    state.leftover = 0;
    state.armed = true;
  }
  state.lastEventAt = now;

  const notch = isNotchDelta(primary, event.deltaMode);
  if (!state.armed) {
    if (notch && now - state.lastStepAt >= cooldownMs) {
      state.armed = true;
      state.leftover = 0;
    } else {
      return 0;
    }
  }

  state.leftover += primary;
  if (Math.abs(state.leftover) < threshold) {
    return 0;
  }

  const direction = state.leftover > 0 ? 1 : -1;
  state.armed = false;
  state.leftover = 0;
  state.lastStepAt = now;
  return direction;
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
