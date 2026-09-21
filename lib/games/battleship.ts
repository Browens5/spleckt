/**
 * Battleship engine for the games lounge.
 *
 * Classic two-player rules: each player secretly places the standard
 * five-ship fleet on a 10×10 grid, then they take turns firing one shot.
 * A hit or miss both end the turn. Sink every opposing ship to win.
 */

export const GRID = 10;
export const CELL_COUNT = GRID * GRID;

export const FLEET_SPEC = [
  { id: "carrier", name: "Carrier", length: 5 },
  { id: "battleship", name: "Battleship", length: 4 },
  { id: "cruiser", name: "Cruiser", length: 3 },
  { id: "submarine", name: "Submarine", length: 3 },
  { id: "destroyer", name: "Destroyer", length: 2 },
] as const;

export type ShipId = (typeof FLEET_SPEC)[number]["id"];

export type ShipPlacement = {
  id: ShipId;
  origin: number;
  horizontal: boolean;
};

export type Shot = {
  index: number;
  hit: boolean;
};

export type Fleet = {
  ships: ShipPlacement[];
  shotsAgainst: Shot[];
  ready: boolean;
};

export type BattleshipState = {
  game: "battleship";
  players: Array<{ id: string; handle: string; seat: number; bot?: boolean }>;
  viewers: Array<{ id: string; handle: string }>;
  turnSeat: number;
  phase: "placing" | "firing";
  fleets: Record<number, Fleet>;
  winnerSeat: number | null;
  lastShot: {
    attacker: number;
    index: number;
    hit: boolean;
    sunk: ShipId | null;
  } | null;
  moveCount: number;
};

export function shipRow(index: number) {
  return Math.floor(index / GRID);
}

export function shipCol(index: number) {
  return index % GRID;
}

export function cellIndex(row: number, col: number) {
  return row * GRID + col;
}

export function specFor(id: ShipId) {
  return FLEET_SPEC.find((entry) => entry.id === id)!;
}

export function shipCells(ship: ShipPlacement) {
  const spec = specFor(ship.id);
  const cells: number[] = [];
  const row = shipRow(ship.origin);
  const col = shipCol(ship.origin);
  for (let i = 0; i < spec.length; i += 1) {
    const r = ship.horizontal ? row : row + i;
    const c = ship.horizontal ? col + i : col;
    if (r < 0 || r >= GRID || c < 0 || c >= GRID) return [];
    cells.push(cellIndex(r, c));
  }
  return cells;
}

export function occupiedCells(ships: ShipPlacement[]) {
  return new Set(ships.flatMap((ship) => shipCells(ship)));
}

export function validateFleet(ships: ShipPlacement[]) {
  if (ships.length !== FLEET_SPEC.length) return false;
  const ids = new Set(ships.map((ship) => ship.id));
  if (ids.size !== FLEET_SPEC.length) return false;
  const used = new Set<number>();
  for (const ship of ships) {
    const spec = specFor(ship.id);
    const cells = shipCells(ship);
    if (cells.length !== spec.length) return false;
    for (const cell of cells) {
      if (used.has(cell)) return false;
      used.add(cell);
    }
  }
  return true;
}

export function makeRand(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

export function randomFleet(rand: () => number = Math.random): ShipPlacement[] {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ships: ShipPlacement[] = [];
    const used = new Set<number>();
    let ok = true;
    for (const spec of FLEET_SPEC) {
      let placed = false;
      for (let n = 0; n < 50; n += 1) {
        const horizontal = rand() < 0.5;
        const maxRow = horizontal ? GRID - 1 : GRID - spec.length;
        const maxCol = horizontal ? GRID - spec.length : GRID - 1;
        const row = Math.floor(rand() * (maxRow + 1));
        const col = Math.floor(rand() * (maxCol + 1));
        const ship: ShipPlacement = {
          id: spec.id,
          origin: cellIndex(row, col),
          horizontal,
        };
        const cells = shipCells(ship);
        if (cells.length !== spec.length) continue;
        if (cells.some((cell) => used.has(cell))) continue;
        cells.forEach((cell) => used.add(cell));
        ships.push(ship);
        placed = true;
        break;
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok && validateFleet(ships)) return ships;
  }
  throw new Error("Could not place a legal fleet");
}

export function emptyFleet(): Fleet {
  return { ships: [], shotsAgainst: [], ready: false };
}

export function emptyBattleshipState(): BattleshipState {
  return {
    game: "battleship",
    players: [],
    viewers: [],
    turnSeat: 1,
    phase: "placing",
    fleets: { 1: emptyFleet(), 2: emptyFleet() },
    winnerSeat: null,
    lastShot: null,
    moveCount: 0,
  };
}

export function fleetOf(state: BattleshipState, seat: number) {
  return state.fleets[seat] ?? emptyFleet();
}

export function hitsOnShip(fleet: Fleet, shipId: ShipId) {
  const ship = fleet.ships.find((entry) => entry.id === shipId);
  if (!ship) return 0;
  const cells = new Set(shipCells(ship));
  return fleet.shotsAgainst.filter((shot) => shot.hit && cells.has(shot.index)).length;
}

export function isSunk(fleet: Fleet, shipId: ShipId) {
  return hitsOnShip(fleet, shipId) >= specFor(shipId).length;
}

export function remainingHull(fleet: Fleet) {
  const cells = occupiedCells(fleet.ships);
  const hits = new Set(
    fleet.shotsAgainst.filter((shot) => shot.hit).map((shot) => shot.index),
  );
  let left = 0;
  cells.forEach((cell) => {
    if (!hits.has(cell)) left += 1;
  });
  return left;
}

export function sunkCount(fleet: Fleet) {
  return fleet.ships.filter((ship) => isSunk(fleet, ship.id)).length;
}

export type BattleshipAction =
  | { type: "place"; ships: ShipPlacement[] }
  | { type: "fire"; index: number };

export function applyBattleshipAction(
  state: BattleshipState,
  seat: number,
  action: BattleshipAction,
): { ok: true; finished: boolean } | { ok: false; error: string } {
  if (action.type === "place") {
    if (state.phase !== "placing") {
      return { ok: false, error: "Ships are already at sea" };
    }
    const fleet = fleetOf(state, seat);
    if (fleet.ready) return { ok: false, error: "Fleet already locked in" };
    if (!validateFleet(action.ships)) {
      return { ok: false, error: "Ships must be the full fleet, in bounds, no overlap" };
    }
    fleet.ships = action.ships;
    fleet.ready = true;
    state.fleets[seat] = fleet;
    state.moveCount += 1;
    const one = fleetOf(state, 1);
    const two = fleetOf(state, 2);
    if (one.ready && two.ready) {
      state.phase = "firing";
      state.turnSeat = 1;
    }
    return { ok: true, finished: false };
  }

  if (state.phase !== "firing") {
    return { ok: false, error: "Both fleets must be placed first" };
  }
  if (state.turnSeat !== seat) return { ok: false, error: "Not your turn" };
  if (action.index < 0 || action.index >= CELL_COUNT) {
    return { ok: false, error: "Shot is off the map" };
  }
  const foe = seat === 1 ? 2 : 1;
  const target = fleetOf(state, foe);
  if (target.shotsAgainst.some((shot) => shot.index === action.index)) {
    return { ok: false, error: "You already fired there" };
  }
  const hit = occupiedCells(target.ships).has(action.index);
  target.shotsAgainst.push({ index: action.index, hit });
  let sunk: ShipId | null = null;
  if (hit) {
    for (const ship of target.ships) {
      if (shipCells(ship).includes(action.index) && isSunk(target, ship.id)) {
        sunk = ship.id;
      }
    }
  }
  state.lastShot = { attacker: seat, index: action.index, hit, sunk };
  state.moveCount += 1;
  if (remainingHull(target) === 0) {
    state.winnerSeat = seat;
    return { ok: true, finished: true };
  }
  state.turnSeat = foe;
  return { ok: true, finished: false };
}
