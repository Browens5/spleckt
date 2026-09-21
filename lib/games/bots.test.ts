import assert from "node:assert/strict";
import { emptyConnect4State } from "./connect4";
import { emptyScumState } from "./scum";
import { advanceBots, isBotPlayer, seatBots } from "./bots";
import type { SessionSnapshot } from "./types";

const four = emptyConnect4State();
four.players = [{ id: "human-aaaaaaaa", handle: "Ada", seat: 1 }];
seatBots(four, 1);
assert.equal(four.players.length, 2);
assert.equal(isBotPlayer(four.players[1]!), true);

const snap: SessionSnapshot = {
  code: "ABCDE",
  status: "playing",
  version: 1,
  state: four,
};
four.turnSeat = 2;
advanceBots(snap);
assert.equal(four.moveCount, 1);
assert.equal(four.turnSeat, 1);

const scum = emptyScumState();
scum.players = [{ id: "human-bbbbbbbb", handle: "Ada", seat: 1 }];
seatBots(scum, 2);
assert.equal(scum.players.length, 3);
assert.equal(scum.players.filter(isBotPlayer).length, 2);

console.log("bot tests ok");
