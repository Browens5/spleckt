/**
 * Lightweight table computers. They use the same engines as humans and
 * take a turn whenever the current seat is a bot.
 */

import { applyMove, legalMoves, type Seat } from "./checkers";
import {
  applyBattleshipAction,
  randomFleet,
  type BattleshipState,
} from "./battleship";
import { applyConnect4Action, pickConnect4Column, type Connect4State } from "./connect4";
import {
  applyScumAction,
  cardRank,
  legalScumActions,
  type ScumState,
} from "./scum";
import type { CheckersState, GamePlayer, GameState, SessionSnapshot } from "./types";

export const BOT_PREFIX = "bot-";
export const BOT_HANDLES = ["Chip", "Dixie", "Sonny", "Mabel", "Rex", "Pearl"] as const;

export function isBotPlayer(player: Pick<GamePlayer, "id" | "bot">) {
  return player.bot === true || player.id.startsWith(BOT_PREFIX);
}

export function botIdFor(index: number) {
  const handle = BOT_HANDLES[index % BOT_HANDLES.length]!;
  return `${BOT_PREFIX}${handle.toLowerCase()}-${String(index + 1).padStart(2, "0")}`;
}

export function maxBotsFor(game: SessionSnapshot["state"]["game"] | string) {
  return game === "scum" ? 5 : 1;
}

function nextSeat(taken: number[]) {
  const used = new Set(taken);
  let seat = 1;
  while (used.has(seat)) seat += 1;
  return seat;
}

export function seatBots(state: GameState, count: number) {
  const cap = maxBotsFor(state.game);
  const room = Math.max(0, cap - state.players.filter(isBotPlayer).length);
  const add = Math.min(count, room);
  for (let i = 0; i < add; i += 1) {
    const index = state.players.filter(isBotPlayer).length;
    const handle = BOT_HANDLES[index % BOT_HANDLES.length]!;
    state.players.push({
      id: botIdFor(index),
      handle,
      seat: nextSeat(state.players.map((entry) => entry.seat)),
      bot: true,
    });
  }
}

function currentPlayer(state: GameState) {
  return state.players.find((entry) => entry.seat === state.turnSeat) ?? null;
}

function playCheckers(state: CheckersState) {
  const seat = (state.turnSeat === 2 ? 2 : 1) as Seat;
  const moves = legalMoves(state.board, seat, state.continueFrom);
  if (moves.length === 0) return false;
  const jumps = moves.filter((move) => move.captured != null);
  const pool = jumps.length > 0 ? jumps : moves;
  const move = pool[Math.floor(Math.random() * pool.length)]!;
  const result = applyMove(state.board, seat, move);
  state.board = result.board;
  state.turnSeat = result.nextSeat;
  state.continueFrom = result.continueFrom;
  state.winnerSeat = result.winner;
  state.moveCount += 1;
  state.lastMove = move;
  return Boolean(result.winner);
}

function playScum(state: ScumState) {
  const actions = legalScumActions(state, state.turnSeat);
  if (actions.length === 0) return false;
  const plays = actions.filter((action) => action.type === "play");
  let chosen = actions[actions.length - 1]!;
  if (plays.length > 0) {
    plays.sort((a, b) => {
      if (a.type !== "play" || b.type !== "play") return 0;
      const rankDelta = cardRank(a.cards[0]!) - cardRank(b.cards[0]!);
      if (rankDelta !== 0) return rankDelta;
      return b.cards.length - a.cards.length;
    });
    chosen = plays[0]!;
  }
  const result = applyScumAction(state, state.turnSeat, chosen);
  return result.ok && result.finished;
}

function playConnect4(state: Connect4State) {
  const col = pickConnect4Column(state.board, state.turnSeat === 2 ? 2 : 1);
  const result = applyConnect4Action(state, state.turnSeat, { type: "drop", col });
  return result.ok && result.finished;
}

function playBattleship(state: BattleshipState) {
  if (state.phase === "placing") {
    for (const player of state.players) {
      if (!isBotPlayer(player)) continue;
      if (state.fleets[player.seat]?.ready) continue;
      applyBattleshipAction(state, player.seat, {
        type: "place",
        ships: randomFleet(),
      });
    }
    return false;
  }

  const player = currentPlayer(state);
  if (!player || !isBotPlayer(player)) return false;
  const seat = player.seat;
  const foe = seat === 1 ? 2 : 1;
  const target = state.fleets[foe];
  const taken = new Set((target?.shotsAgainst ?? []).map((shot) => shot.index));
  const hits = (target?.shotsAgainst ?? []).filter((shot) => shot.hit);
  const neighbors = (index: number) => {
    const row = Math.floor(index / 10);
    const col = index % 10;
    const next: number[] = [];
    if (col > 0) next.push(index - 1);
    if (col < 9) next.push(index + 1);
    if (row > 0) next.push(index - 10);
    if (row < 9) next.push(index + 10);
    return next.filter((cell) => !taken.has(cell));
  };
  let pick: number | undefined;
  for (const hit of hits.slice().reverse()) {
    const opts = neighbors(hit.index);
    if (opts.length > 0) {
      pick = opts[0];
      break;
    }
  }
  if (pick == null) {
    const water = Array.from({ length: 100 }, (_, index) => index).filter(
      (index) => !taken.has(index),
    );
    pick = water[Math.floor(Math.random() * Math.max(1, water.length))];
  }
  if (pick == null) return false;
  const result = applyBattleshipAction(state, seat, { type: "fire", index: pick });
  return result.ok && result.finished;
}

function botShouldAct(state: GameState) {
  if (state.game === "battleship" && state.phase === "placing") {
    return state.players.some(
      (player) => isBotPlayer(player) && !state.fleets[player.seat]?.ready,
    );
  }
  const player = currentPlayer(state);
  return Boolean(player && isBotPlayer(player));
}

export function needsBotTurn(state: GameState) {
  return botShouldAct(state);
}

function playOne(state: GameState) {
  if (state.game === "checkers") return playCheckers(state);
  if (state.game === "scum") return playScum(state);
  if (state.game === "connect4") return playConnect4(state);
  return playBattleship(state);
}

/** Apply consecutive computer turns. Returns whether the match ended. */
export function advanceBots(snapshot: SessionSnapshot, limit = 8) {
  if (snapshot.status !== "playing") return false;
  let finished = false;
  for (let i = 0; i < limit; i += 1) {
    if (!botShouldAct(snapshot.state)) break;
    finished = playOne(snapshot.state) || finished;
    if (finished) {
      snapshot.status = "finished";
      break;
    }
  }
  return finished;
}
