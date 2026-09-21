import assert from "node:assert/strict";
import {
  applyConnect4Action,
  COLS,
  emptyConnect4State,
  legalColumns,
  pickConnect4Column,
  winnerFrom,
  type Connect4State,
} from "./connect4";

function table(): Connect4State {
  const state = emptyConnect4State();
  state.players = [
    { id: "p1", handle: "Ada", seat: 1 },
    { id: "p2", handle: "Bea", seat: 2 },
  ];
  return state;
}

const state = table();
assert.deepEqual(legalColumns(state.board), [0, 1, 2, 3, 4, 5, 6]);

for (let i = 0; i < 3; i += 1) {
  assert.equal(applyConnect4Action(state, 1, { type: "drop", col: 0 }).ok, true);
  assert.equal(applyConnect4Action(state, 2, { type: "drop", col: 1 }).ok, true);
}
const verticalWin = applyConnect4Action(state, 1, { type: "drop", col: 0 });
assert.equal(verticalWin.ok, true);
assert.equal(state.winnerSeat, 1);
assert.equal(winnerFrom(state.board, state.lastDrop!.index), 1);

const horiz = table();
for (const col of [0, 0, 1, 1, 2, 2, 3]) {
  applyConnect4Action(horiz, horiz.turnSeat, { type: "drop", col });
}
assert.equal(horiz.winnerSeat, 1);

const fullCol = table();
for (let i = 0; i < 6; i += 1) {
  assert.equal(applyConnect4Action(fullCol, fullCol.turnSeat, { type: "drop", col: 6 }).ok, true);
}
assert.equal(applyConnect4Action(fullCol, fullCol.turnSeat, { type: "drop", col: 6 }).ok, false);

const block = table();
applyConnect4Action(block, 1, { type: "drop", col: 0 });
applyConnect4Action(block, 2, { type: "drop", col: 1 });
applyConnect4Action(block, 1, { type: "drop", col: 0 });
applyConnect4Action(block, 2, { type: "drop", col: 1 });
applyConnect4Action(block, 1, { type: "drop", col: 0 });
const col = pickConnect4Column(block.board, 2, () => 0.4, 3);
assert.equal(col, 0);

assert.equal(COLS, 7);
console.log("connect4 tests ok");
