import type { Board, Move, Seat } from "./checkers";

export type GameId = "checkers";

export type TableInfo = {
  id: string;
  number: number;
  game: GameId;
  gameName: string;
  tagline: string;
};

/** The lounge floor plan. One table for now; more tables slot in here. */
export const LOUNGE_TABLES: TableInfo[] = [
  {
    id: "table-1",
    number: 1,
    game: "checkers",
    gameName: "Checkers",
    tagline: "Classic 8×8 draughts — jumps are optional, kings fly back.",
  },
];

export type GamePlayer = {
  id: string;
  handle: string;
  seat: Seat;
};

export type GameViewer = {
  id: string;
  handle: string;
};

export type GameStatus = "waiting" | "playing" | "finished";

export type CheckersState = {
  game: GameId;
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

export type SessionSnapshot = {
  code: string;
  status: GameStatus;
  version: number;
  state: CheckersState;
};

export type PlayerRole =
  | { kind: "player"; seat: Seat }
  | { kind: "viewer" }
  | { kind: "none" };

export function roleFor(state: CheckersState, playerId: string): PlayerRole {
  const player = state.players.find((entry) => entry.id === playerId);
  if (player) return { kind: "player", seat: player.seat };
  if (state.viewers.some((entry) => entry.id === playerId)) {
    return { kind: "viewer" };
  }
  return { kind: "none" };
}
