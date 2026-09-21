import assert from "node:assert/strict";
import {
  applyScumAction,
  applyTaxes,
  beats,
  beginNextRound,
  cardRank,
  dealHands,
  dealScum,
  emptyScumState,
  formatCard,
  isLegalAction,
  makeRand,
  rankTitle,
  sameSet,
  type ScumState,
} from "./scum";

function table(seats = 3): ScumState {
  const state = emptyScumState();
  for (let seat = 1; seat <= seats; seat += 1) {
    state.players.push({
      id: `p${seat}`,
      handle: `Player${seat}`,
      seat,
    });
  }
  state.dealerSeat = 1;
  return state;
}

assert.equal(cardRank(0), 0);
assert.equal(formatCard(0), "2♣");
assert.equal(formatCard(4 * 12 + 2), "A♥");
assert.ok(sameSet([8, 9, 10, 11])); // four 4s
assert.ok(!sameSet([8, 12]));
assert.ok(beats([20, 21], [48, 49])); // two 7s beaten by two aces
assert.ok(!beats([20, 21], [0])); // pair not beaten by a single 2
assert.ok(!beats([20, 21], [24, 25, 26])); // pair not beaten by three 8s
assert.ok(beats([0], [4])); // 2 is lowest, 3 beats it
assert.ok(!beats([48], [0])); // ace is highest

const hands = dealHands([1, 2, 3], 1, makeRand(7));
const dealt = Object.values(hands).reduce((sum, list) => sum + list.length, 0);
assert.equal(dealt, 52);
assert.equal(hands[2]!.length, 18); // first card goes to dealer's left
assert.equal(hands[3]!.length, 17);
assert.equal(hands[1]!.length, 17);

assert.equal(rankTitle(1, 4), "President");
assert.equal(rankTitle(2, 4), "Vice President");
assert.equal(rankTitle(3, 4), "Vice Scum");
assert.equal(rankTitle(4, 4), "Scum");
assert.equal(rankTitle(1, 3), "President");
assert.equal(rankTitle(3, 3), "Scum");

const playing = table(3);
playing.hands = {
  1: [0, 4, 20, 21], // 2, 3, pair of 7s
  2: [48, 49], // pair of aces
  3: [44], // king
};
playing.turnSeat = 1;

assert.equal(isLegalAction(playing, 1, { type: "pass" }), false);
assert.equal(isLegalAction(playing, 1, { type: "play", cards: [20, 21] }), true);

const lead = applyScumAction(playing, 1, { type: "play", cards: [20, 21] });
assert.equal(lead.ok, true);
assert.equal(playing.turnSeat, 2);
assert.equal(playing.lastPlay?.cards.length, 2);

assert.equal(isLegalAction(playing, 2, { type: "play", cards: [48] }), false);
assert.equal(isLegalAction(playing, 2, { type: "play", cards: [48, 49] }), true);
assert.equal(isLegalAction(playing, 2, { type: "pass" }), true);

applyScumAction(playing, 2, { type: "pass" });
assert.equal(playing.turnSeat, 3);
assert.deepEqual(playing.passedSincePlay, [2]);

applyScumAction(playing, 3, { type: "pass" });
assert.equal(playing.lastPlay, null);
assert.equal(playing.turnSeat, 1);
assert.deepEqual(playing.hands[1], [0, 4]);

const later = table(3);
later.hands = {
  1: [0, 20, 21],
  2: [24, 25, 48, 49],
  3: [28, 29],
};
later.turnSeat = 1;
applyScumAction(later, 1, { type: "play", cards: [20, 21] });
applyScumAction(later, 2, { type: "pass" });
applyScumAction(later, 3, { type: "play", cards: [28, 29] });
applyScumAction(later, 1, { type: "pass" });
assert.equal(isLegalAction(later, 2, { type: "play", cards: [48, 49] }), true);
applyScumAction(later, 2, { type: "play", cards: [48, 49] });
assert.equal(later.lastPlay?.seat, 2);

const ending = table(3);
ending.hands = {
  1: [0],
  2: [4, 8],
  3: [48],
};
ending.turnSeat = 1;
applyScumAction(ending, 1, { type: "play", cards: [0] });
assert.deepEqual(ending.finishOrder, [1]);
applyScumAction(ending, 2, { type: "pass" });
const last = applyScumAction(ending, 3, { type: "play", cards: [48] });
assert.equal(last.ok, true);
if (last.ok) assert.equal(last.finished, true);
assert.deepEqual(ending.finishOrder, [1, 3, 2]);
assert.equal(rankTitle(ending.finishOrder.indexOf(1) + 1, 3), "President");
assert.equal(rankTitle(ending.finishOrder.indexOf(2) + 1, 3), "Scum");

const dealtState = table(4);
dealScum(dealtState, makeRand(99));
assert.equal(dealtState.turnSeat, 2);
assert.equal(
  Object.values(dealtState.hands).reduce((sum, list) => sum + list.length, 0),
  52,
);

const taxed = table(3);
taxed.hands = {
  1: [0, 4, 8, 12], // president: 2, 3, 4, 5
  2: [16, 20, 24],
  3: [44, 48, 32], // scum: K, A, 10
};
applyTaxes(taxed, [1, 2, 3]);
assert.ok(taxed.hands[1]!.includes(48), "president receives scum's ace");
assert.ok(taxed.hands[3]!.includes(0), "scum receives president's lowest 2");
assert.equal(taxed.hands[1]!.length, 4);
assert.equal(taxed.hands[3]!.length, 3);

const fourTax = table(4);
fourTax.hands = {
  1: [0, 1, 4, 8, 12], // president: pair of 2s, 3, 4, 5
  2: [16, 20, 24], // VP
  3: [28, 32, 48], // vice scum: 9, 10, ace
  4: [44, 45, 40, 36], // scum: pair of kings, Q, J
};
applyTaxes(fourTax, [1, 2, 3, 4]);
assert.ok(fourTax.hands[1]!.includes(44) && fourTax.hands[1]!.includes(45));
assert.ok(fourTax.hands[4]!.includes(0) && fourTax.hands[4]!.includes(1));
assert.ok(fourTax.hands[2]!.includes(48));
assert.ok(fourTax.hands[3]!.includes(16));

const next = table(3);
next.hands = {
  1: [0],
  2: [4],
  3: [8],
};
next.finishOrder = [1, 3, 2];
next.round = 1;
beginNextRound(next, makeRand(3));
assert.equal(next.round, 2);
assert.deepEqual(next.lastFinishOrder, [1, 3, 2]);
assert.equal(next.dealerSeat, 2, "scum deals the next hand");
assert.equal(next.finishOrder.length, 0);
assert.equal(
  Object.values(next.hands).reduce((sum, list) => sum + list.length, 0),
  52,
);

console.log("scum tests ok");
