import type { Board, Move, Seat } from "./checkers";
import type { ScumState } from "./scum";
import type { BattleshipState } from "./battleship";
import type { Connect4State } from "./connect4";

export type GameId = "checkers" | "scum" | "battleship" | "connect4";

export type TableInfo = {
  id: "table-1" | "table-2" | "table-3" | "table-4";
  number: number;
  game: GameId;
  gameName: string;
  tagline: string;
};

/** The lounge floor plan. Click a table to start or join that game. */
export const LOUNGE_TABLES: TableInfo[] = [
  {
    id: "table-1",
    number: 1,
    game: "checkers",
    gameName: "Checkers",
    tagline: "Classic 8×8 draughts — jumps are optional, kings fly back.",
  },
  {
    id: "table-2",
    number: 2,
    game: "scum",
    gameName: "Scum",
    tagline:
      "Presidents: 3–6 players, Ace high / 2 low. Hands keep going at the table — President gets Scum's best cards.",
  },
  {
    id: "table-3",
    number: 3,
    game: "battleship",
    gameName: "Battleship",
    tagline:
      "Two captains, 10×10 grids. Place the fleet, then take turns firing — sink every ship to win.",
  },
  {
    id: "table-4",
    number: 4,
    game: "connect4",
    gameName: "Connect 4",
    tagline:
      "Drop discs in a 7×6 well. Four in a row — across, down, or diagonal — wins.",
  },
];

export function tableForGame(game: GameId) {
  return LOUNGE_TABLES.find((table) => table.game === game) ?? LOUNGE_TABLES[0]!;
}

export type GamePlayer = {
  id: string;
  handle: string;
  seat: number;
  bot?: boolean;
};

export type GameViewer = {
  id: string;
  handle: string;
};

export type GameStatus = "waiting" | "playing" | "finished";

export type CheckersState = {
  game: "checkers";
  players: GamePlayer[];
  viewers: GameViewer[];
  board: Board;
  turnSeat: Seat;
  /** Set mid multi-jump: the mover must jump again from this square. */
  continueFrom: number | null;
  winnerSeat: Seat | null;
  moveCount: number;
  lastMove: Move | null;
};

export type GameState = CheckersState | ScumState | BattleshipState | Connect4State;

export type SessionSnapshot = {
  code: string;
  status: GameStatus;
  version: number;
  state: GameState;
  /** Epoch ms of the last persisted write — used to delay computer turns. */
  updatedAt?: number;
};

export type PlayerRole =
  | { kind: "player"; seat: number }
  | { kind: "viewer" }
  | { kind: "none" };

export function isCheckersState(state: GameState): state is CheckersState {
  return state.game === "checkers";
}

export function isScumState(state: GameState): state is ScumState {
  return state.game === "scum";
}

export function isBattleshipState(state: GameState): state is BattleshipState {
  return state.game === "battleship";
}

export function isConnect4State(state: GameState): state is Connect4State {
  return state.game === "connect4";
}

export function roleFor(state: GameState, playerId: string): PlayerRole {
  const player = state.players.find((entry) => entry.id === playerId);
  if (player) return { kind: "player", seat: player.seat };
  if (state.viewers.some((entry) => entry.id === playerId)) {
    return { kind: "viewer" };
  }
  return { kind: "none" };
}
