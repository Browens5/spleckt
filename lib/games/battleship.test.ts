import assert from "node:assert/strict";
import {
  applyBattleshipAction,
  CELL_COUNT,
  cellIndex,
  emptyBattleshipState,
  FLEET_SPEC,
  makeRand,
  occupiedCells,
  randomFleet,
  remainingHull,
  shipCells,
  sunkCount,
  validateFleet,
  type BattleshipState,
  type ShipPlacement,
} from "./battleship";

function table(): BattleshipState {
  const state = emptyBattleshipState();
  state.players = [
    { id: "p1", handle: "Ada", seat: 1 },
    { id: "p2", handle: "Bea", seat: 2 },
  ];
  return state;
}

const destroyer: ShipPlacement = {
  id: "destroyer",
  origin: cellIndex(0, 0),
  horizontal: true,
};
assert.deepEqual(shipCells(destroyer), [0, 1]);

const vertical: ShipPlacement = {
  id: "destroyer",
  origin: cellIndex(8, 9),
  horizontal: false,
};
assert.deepEqual(shipCells(vertical), [cellIndex(8, 9), cellIndex(9, 9)]);

const offMap: ShipPlacement = {
  id: "carrier",
  origin: cellIndex(0, 8),
  horizontal: true,
};
assert.deepEqual(shipCells(offMap), []);

const fleetA = randomFleet(makeRand(31));
const fleetB = randomFleet(makeRand(77));
assert.equal(validateFleet(fleetA), true);
assert.equal(validateFleet(fleetB), true);
assert.equal(occupiedCells(fleetA).size, 17);
assert.equal(FLEET_SPEC.reduce((sum, spec) => sum + spec.length, 0), 17);

const overlap = fleetA.map((ship, index) =>
  index === 0 ? { ...ship, origin: fleetA[1]!.origin } : ship,
);
assert.equal(validateFleet(overlap), false);

const state = table();
assert.equal(
  applyBattleshipAction(state, 1, { type: "fire", index: 0 }).ok,
  false,
);

const placed1 = applyBattleshipAction(state, 1, { type: "place", ships: fleetA });
assert.equal(placed1.ok, true);
assert.equal(state.phase, "placing");
const placed2 = applyBattleshipAction(state, 2, { type: "place", ships: fleetB });
assert.equal(placed2.ok, true);
assert.equal(state.phase, "firing");
assert.equal(state.turnSeat, 1);

const missIndex = [...Array(CELL_COUNT).keys()].find(
  (index) => !occupiedCells(fleetB).has(index),
)!;
const miss = applyBattleshipAction(state, 1, { type: "fire", index: missIndex });
assert.equal(miss.ok, true);
assert.equal(state.lastShot?.hit, false);
assert.equal(state.turnSeat, 2);

const waterOnA = [...Array(CELL_COUNT).keys()].find(
  (index) => !occupiedCells(fleetA).has(index),
)!;
applyBattleshipAction(state, 2, { type: "fire", index: waterOnA });
assert.equal(state.turnSeat, 1);

const repeat = applyBattleshipAction(state, 1, { type: "fire", index: missIndex });
assert.equal(repeat.ok, false);

const hunt = table();
applyBattleshipAction(hunt, 1, { type: "place", ships: fleetA });
applyBattleshipAction(hunt, 2, { type: "place", ships: fleetB });
const targetCells = [...occupiedCells(fleetB)];
let seat: 1 | 2 = 1;
let finished = false;
for (const index of targetCells) {
  const result = applyBattleshipAction(hunt, seat, { type: "fire", index });
  assert.equal(result.ok, true);
  if (result.ok && result.finished) {
    finished = true;
    break;
  }
  seat = seat === 1 ? 2 : 1;
  // opponent wastes a shot on water so we can keep firing the remaining hull
  if (seat === 2) {
    const water = [...Array(CELL_COUNT).keys()].find(
      (cell) =>
        !occupiedCells(fleetA).has(cell) &&
        !hunt.fleets[1]!.shotsAgainst.some((shot) => shot.index === cell),
    );
    if (water != null) applyBattleshipAction(hunt, 2, { type: "fire", index: water });
    seat = 1;
  }
}
assert.equal(finished, true);
assert.equal(hunt.winnerSeat, 1);
assert.equal(remainingHull(hunt.fleets[2]!), 0);
assert.equal(sunkCount(hunt.fleets[2]!), 5);

console.log("battleship tests ok");
