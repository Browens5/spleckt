"use client";

import { COLS, ROWS, cellIndex, dropRow, type Connect4State } from "@/lib/games/connect4";

type Connect4PlayProps = {
  state: Connect4State;
  mySeat: number | null;
  myTurn: boolean;
  busy: boolean;
  onDrop: (col: number) => void;
};

export function Connect4Play({
  state,
  mySeat,
  myTurn,
  busy,
  onDrop,
}: Connect4PlayProps) {
  return (
    <div className="c4-table">
      <div className="c4-well" role="grid" aria-label="Connect 4">
        {Array.from({ length: COLS }, (_, col) => {
          const canDrop = myTurn && mySeat != null && dropRow(state.board, col) >= 0 && !busy;
          return (
            <button
              key={col}
              type="button"
              className="c4-col"
              disabled={!canDrop}
              onClick={() => onDrop(col)}
              aria-label={`Drop in column ${col + 1}`}
            >
              {Array.from({ length: ROWS }, (_, visualRow) => {
                const row = ROWS - 1 - visualRow;
                const disc = state.board[cellIndex(row, col)] ?? 0;
                const last = state.lastDrop?.index === cellIndex(row, col);
                return (
                  <span
                    key={row}
                    className={
                      "c4-slot" +
                      (disc === 1 ? " is-red" : disc === 2 ? " is-yellow" : "") +
                      (last ? " is-last" : "")
                    }
                  />
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
