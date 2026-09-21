/**
 * Connect Four engine for the games lounge.
 *
 * Two players drop discs into a 7×6 grid. Four in a row — horizontal,
 * vertical, or diagonal — wins. A full board with no four-in-a-row is a draw.
 * Row 0 is the bottom of the well.
 */

export const COLS = 7;
export const ROWS = 6;
export const CELL_COUNT = COLS * ROWS;

export type Disc = 1 | 2;

export type Connect4State = {
  game: "connect4";
  players: Array<{ id: string; handle: string; seat: number; bot?: boolean }>;
  viewers: Array<{ id: string; handle: string }>;
  board: number[];
  turnSeat: number;
  winnerSeat: number | null;
  lastDrop: { seat: number; index: number } | null;
  moveCount: number;
};

export function emptyBoard() {
  return Array.from({ length: CELL_COUNT }, () => 0);
}

export function emptyConnect4State(): Connect4State {
  return {
    game: "connect4",
    players: [],
    viewers: [],
    board: emptyBoard(),
    turnSeat: 1,
    winnerSeat: null,
    lastDrop: null,
    moveCount: 0,
  };
}

export function cellIndex(row: number, col: number) {
  return row * COLS + col;
}

export function colOf(index: number) {
  return index % COLS;
}

export function rowOf(index: number) {
  return Math.floor(index / COLS);
}

export function dropRow(board: number[], col: number) {
  if (col < 0 || col >= COLS) return -1;
  for (let row = 0; row < ROWS; row += 1) {
    if (board[cellIndex(row, col)] === 0) return row;
  }
  return -1;
}

export function legalColumns(board: number[]) {
  return Array.from({ length: COLS }, (_, col) => col).filter(
    (col) => dropRow(board, col) >= 0,
  );
}

const DIRS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function winnerFrom(board: number[], index: number) {
  const seat = board[index];
  if (!seat) return null;
  const startRow = rowOf(index);
  const startCol = colOf(index);
  for (const [dRow, dCol] of DIRS) {
    let count = 1;
    for (const sign of [-1, 1]) {
      for (let step = 1; step < 4; step += 1) {
        const row = startRow + dRow * sign * step;
        const col = startCol + dCol * sign * step;
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) break;
        if (board[cellIndex(row, col)] !== seat) break;
        count += 1;
      }
    }
    if (count >= 4) return seat;
  }
  return null;
}

export function boardFull(board: number[]) {
  return board.every((cell) => cell !== 0);
}

export type Connect4Action = { type: "drop"; col: number };

export function applyConnect4Action(
  state: Connect4State,
  seat: number,
  action: Connect4Action,
): { ok: true; finished: boolean } | { ok: false; error: string } {
  if (state.winnerSeat != null) return { ok: false, error: "Game is over" };
  if (state.turnSeat !== seat) return { ok: false, error: "Not your turn" };
  const row = dropRow(state.board, action.col);
  if (row < 0) return { ok: false, error: "That column is full" };
  const index = cellIndex(row, action.col);
  state.board[index] = seat;
  state.lastDrop = { seat, index };
  state.moveCount += 1;
  const winner = winnerFrom(state.board, index);
  if (winner) {
    state.winnerSeat = winner;
    return { ok: true, finished: true };
  }
  if (boardFull(state.board)) {
    state.winnerSeat = 0;
    return { ok: true, finished: true };
  }
  state.turnSeat = seat === 1 ? 2 : 1;
  return { ok: true, finished: false };
}

function lineScore(board: number[], seat: number, row: number, col: number, dRow: number, dCol: number) {
  let mine = 0;
  let foe = 0;
  for (let i = 0; i < 4; i += 1) {
    const r = row + dRow * i;
    const c = col + dCol * i;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;
    const cell = board[cellIndex(r, c)];
    if (cell === seat) mine += 1;
    else if (cell !== 0) foe += 1;
  }
  if (mine > 0 && foe > 0) return 0;
  if (mine === 3) return 40;
  if (mine === 2) return 8;
  if (mine === 1) return 1;
  if (foe === 3) return 30;
  if (foe === 2) return 5;
  return 0;
}

export function evaluateBoard(board: number[], seat: number) {
  let score = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      score += lineScore(board, seat, row, col, 0, 1);
      score += lineScore(board, seat, row, col, 1, 0);
      score += lineScore(board, seat, row, col, 1, 1);
      score += lineScore(board, seat, row, col, 1, -1);
    }
  }
  const center = 3;
  for (let row = 0; row < ROWS; row += 1) {
    if (board[cellIndex(row, center)] === seat) score += 6;
  }
  return score;
}

export function pickConnect4Column(
  board: number[],
  seat: number,
  rand: () => number = Math.random,
  depth = 4,
) {
  const foe = seat === 1 ? 2 : 1;
  const order = [3, 2, 4, 1, 5, 0, 6];

  const search = (grid: number[], toMove: number, ply: number, alpha: number, beta: number): number => {
    const cols = order.filter((col) => dropRow(grid, col) >= 0);
    if (cols.length === 0 || ply === 0) {
      return evaluateBoard(grid, seat);
    }
    let best = toMove === seat ? -1e9 : 1e9;
    for (const col of cols) {
      const row = dropRow(grid, col);
      const index = cellIndex(row, col);
      grid[index] = toMove;
      const win = winnerFrom(grid, index);
      let value: number;
      if (win === seat) value = 10_000 - ply;
      else if (win) value = -10_000 + ply;
      else value = search(grid, toMove === 1 ? 2 : 1, ply - 1, alpha, beta);
      grid[index] = 0;
      if (toMove === seat) {
        if (value > best) best = value;
        if (best > alpha) alpha = best;
      } else {
        if (value < best) best = value;
        if (best < beta) beta = best;
      }
      if (beta <= alpha) break;
    }
    return best;
  };

  let bestCol = order.find((col) => dropRow(board, col) >= 0) ?? 3;
  let bestScore = -1e12;
  for (const col of order) {
    const row = dropRow(board, col);
    if (row < 0) continue;
    const index = cellIndex(row, col);
    board[index] = seat;
    const win = winnerFrom(board, index);
    let score: number;
    if (win === seat) score = 20_000;
    else {
      const reply = dropRow(board, col);
      if (reply >= 0) {
        const threat = cellIndex(reply, col);
        board[threat] = foe;
        const foeWin = winnerFrom(board, threat);
        board[threat] = 0;
        if (foeWin === foe) {
          board[index] = 0;
          continue;
        }
      }
      score = search(board, foe, depth - 1, -1e9, 1e9) + rand() * 0.2;
    }
    board[index] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}
