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
 * Inertia after a flick is ignored even if the event stream has gaps.
 */
export function wheelStep(
  state: WheelNavState,
  event: { deltaX: number; deltaY: number; deltaMode: number },
  now: number,
  options?: {
    threshold?: number;
    settleMs?: number;
    cooldownMs?: number;
    lockMs?: number;
  },
): -1 | 0 | 1 {
  const threshold = options?.threshold ?? 48;
  const settleMs = options?.settleMs ?? 220;
  const cooldownMs = options?.cooldownMs ?? 160;
  const lockMs = options?.lockMs ?? 420;

  const primary = wheelPrimary(event);
  if (primary === 0) return 0;

  const quiet = now - state.lastEventAt > settleMs;
  if (quiet) state.leftover = 0;

  const notch = isNotchDelta(primary, event.deltaMode);
  if (!state.armed) {
    const canNotch = notch && now - state.lastStepAt >= cooldownMs;
    const canFlick =
      !notch && quiet && now - state.lastStepAt >= lockMs;
    if (!canNotch && !canFlick) {
      state.lastEventAt = now;
      return 0;
    }
    state.armed = true;
    state.leftover = 0;
  }

  state.lastEventAt = now;
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

export const CARD_RADIUS = 4.88;
export const CARD_FACE_HEIGHT = 2.26;
export const DECK_RADIUS = 5.05;
export const DECK_SURFACE_Y = 0.16;
/** Card-center height that keeps the face sitting on the turntable. */
export const CARD_Y = DECK_SURFACE_Y + CARD_FACE_HEIGHT * 0.5;

export function cardSeatY(scale: number) {
  return DECK_SURFACE_Y + CARD_FACE_HEIGHT * 0.5 * scale;
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
  expand = 0,
): CarouselSlot {
  if (count <= 0) {
    return { x: 0, y: CARD_Y, z: CARD_RADIUS, yaw: 0, scale: 1, delta: 0 };
  }

  const amount = Math.max(0, Math.min(1, expand));
  const delta = wrapDelta(index - selected, count);
  const spacing = count <= 3 ? 0.36 : count <= 5 ? 0.318 : 0.27;
  const angle = delta * spacing;
  const focus = Math.max(0, 1 - Math.abs(delta));
  const neighbor = 1 - focus;
  const lift = amount * focus;
  const scale =
    (1.04 - Math.min(0.1, Math.abs(delta) * 0.05)) *
    (1 + lift * 0.05) *
    (1 - amount * neighbor * 0.06);

  return {
    x: Math.sin(angle) * (CARD_RADIUS + neighbor * 0.04),
    y: cardSeatY(scale) + lift * 0.015,
    z: Math.cos(angle) * CARD_RADIUS - neighbor * 0.16 + lift * 0.04,
    yaw: ((angle * 180) / Math.PI) * (0.78 * (1 - lift * 0.7)),
    scale,
    delta,
  };
}

/** Local plane coords are x/z in [-0.5, 0.5]. Texture v=0 is the top of the painted card. */
export function cardUvFromLocal(x: number, z: number) {
  if (Math.abs(x) > 0.5 + 1e-4 || Math.abs(z) > 0.5 + 1e-4) return null;
  return { u: x + 0.5, v: z + 0.5 };
}
