/**
 * Checkers (English draughts) engine for the games lounge.
 *
 * Board is a flat array of 64 cells, index = row * 8 + col.
 * Row 7 is seat 1's home edge (seat 1 marches toward row 0);
 * row 0 is seat 2's home edge (seat 2 marches toward row 7).
 * Only dark squares ((row + col) % 2 === 1) are playable.
 */

export type Seat = 1 | 2;

export type Piece = {
  seat: Seat;
  king: boolean;
};

export type Board = (Piece | null)[];

export type Move = {
  from: number;
  to: number;
  /** Index of the captured piece, if this move is a jump. */
  captured: number | null;
  /** True when the piece is crowned by this move. */
  crowned: boolean;
};

export const BOARD_SIZE = 8;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export function rowOf(index: number) {
  return Math.floor(index / BOARD_SIZE);
}

export function colOf(index: number) {
  return index % BOARD_SIZE;
}

export function isDarkSquare(index: number) {
  return (rowOf(index) + colOf(index)) % 2 === 1;
}

export function initialBoard(): Board {
  const board: Board = new Array(CELL_COUNT).fill(null);
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (!isDarkSquare(index)) continue;
    const row = rowOf(index);
    if (row <= 2) board[index] = { seat: 2, king: false };
    if (row >= 5) board[index] = { seat: 1, king: false };
  }
  return board;
}

function forwardDir(seat: Seat) {
  return seat === 1 ? -1 : 1;
}

function crownRow(seat: Seat) {
  return seat === 1 ? 0 : BOARD_SIZE - 1;
}

function pieceDirections(piece: Piece) {
  if (piece.king) return [-1, 1];
  return [forwardDir(piece.seat)];
}

function movesForPiece(board: Board, index: number, jumpsOnly: boolean): Move[] {
  const piece = board[index];
  if (!piece) return [];
  const row = rowOf(index);
  const col = colOf(index);
  const moves: Move[] = [];

  for (const dRow of pieceDirections(piece)) {
    for (const dCol of [-1, 1]) {
      const stepRow = row + dRow;
      const stepCol = col + dCol;
      if (stepRow < 0 || stepRow >= BOARD_SIZE || stepCol < 0 || stepCol >= BOARD_SIZE) {
        continue;
      }
      const stepIndex = stepRow * BOARD_SIZE + stepCol;
      const occupant = board[stepIndex];

      if (!occupant) {
        if (!jumpsOnly) {
          moves.push({
            from: index,
            to: stepIndex,
            captured: null,
            crowned: !piece.king && stepRow === crownRow(piece.seat),
          });
        }
        continue;
      }

      if (occupant.seat === piece.seat) continue;

      const jumpRow = row + dRow * 2;
      const jumpCol = col + dCol * 2;
      if (jumpRow < 0 || jumpRow >= BOARD_SIZE || jumpCol < 0 || jumpCol >= BOARD_SIZE) {
        continue;
      }
      const jumpIndex = jumpRow * BOARD_SIZE + jumpCol;
      if (board[jumpIndex]) continue;
      moves.push({
        from: index,
        to: jumpIndex,
        captured: stepIndex,
        crowned: !piece.king && jumpRow === crownRow(piece.seat),
      });
    }
  }

  return moves;
}

/**
 * All legal moves for a seat. Captures are mandatory: if any jump exists,
 * only jumps are returned. When `continueFrom` is set (mid multi-jump),
 * only further jumps by that piece are legal.
 */
export function legalMoves(
  board: Board,
  seat: Seat,
  continueFrom: number | null = null,
): Move[] {
  if (continueFrom !== null) {
    const piece = board[continueFrom];
    if (!piece || piece.seat !== seat) return [];
    return movesForPiece(board, continueFrom, true);
  }

  const steps: Move[] = [];
  const jumps: Move[] = [];
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const piece = board[index];
    if (!piece || piece.seat !== seat) continue;
    for (const move of movesForPiece(board, index, false)) {
      (move.captured !== null ? jumps : steps).push(move);
    }
  }
  return jumps.length > 0 ? jumps : steps;
}

export type MoveResult = {
  board: Board;
  /** Seat to move next (unchanged when a multi-jump continues). */
  nextSeat: Seat;
  /** Square the mover must continue jumping from, if the turn continues. */
  continueFrom: number | null;
  /** Winning seat, if this move ended the game. */
  winner: Seat | null;
};

/** Applies a move already validated against legalMoves. */
export function applyMove(board: Board, seat: Seat, move: Move): MoveResult {
  const next = board.slice();
  const piece = next[move.from];
  if (!piece) throw new Error("No piece on the source square");

  next[move.from] = null;
  if (move.captured !== null) next[move.captured] = null;
  next[move.to] = move.crowned ? { seat: piece.seat, king: true } : piece;

  // Multi-jump: same piece keeps jumping unless it was just crowned.
  if (move.captured !== null && !move.crowned) {
    const followUps = movesForPiece(next, move.to, true);
    if (followUps.length > 0) {
      return { board: next, nextSeat: seat, continueFrom: move.to, winner: null };
    }
  }

  const opponent: Seat = seat === 1 ? 2 : 1;
  const opponentMoves = legalMoves(next, opponent, null);
  if (opponentMoves.length === 0) {
    return { board: next, nextSeat: opponent, continueFrom: null, winner: seat };
  }

  return { board: next, nextSeat: opponent, continueFrom: null, winner: null };
}

export function findMove(moves: Move[], from: number, to: number) {
  return moves.find((move) => move.from === from && move.to === to) ?? null;
}

export function pieceCount(board: Board, seat: Seat) {
  return board.reduce(
    (count, piece) => (piece && piece.seat === seat ? count + 1 : count),
    0,
  );
}
