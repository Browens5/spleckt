"use client";

import { Fragment, useState } from "react";
import {
  FLEET_SPEC,
  GRID,
  cellIndex,
  occupiedCells,
  randomFleet,
  shipCells,
  specFor,
  type BattleshipState,
  type Fleet,
  type ShipId,
  type ShipPlacement,
} from "@/lib/games/battleship";

type BattleshipPlayProps = {
  state: BattleshipState;
  mySeat: number | null;
  myTurn: boolean;
  busy: boolean;
  onPlace: (ships: ShipPlacement[]) => void;
  onFire: (index: number) => void;
};

const COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

function Grid({
  title,
  cells,
  disabled,
  onCell,
}: {
  title: string;
  cells: Array<{ className: string; label?: string }>;
  disabled?: boolean;
  onCell?: (index: number) => void;
}) {
  return (
    <div className="bs-board">
      <p className="bs-board__title">{title}</p>
      <div className="bs-grid" role="grid" aria-label={title}>
        <span className="bs-grid__corner" />
        {COLS.map((col) => (
          <span key={col} className="bs-grid__head">
            {col}
          </span>
        ))}
        {Array.from({ length: GRID }, (_, row) => (
          <Fragment key={row}>
            <span className="bs-grid__head">{row + 1}</span>
            {Array.from({ length: GRID }, (_, col) => {
              const index = cellIndex(row, col);
              const cell = cells[index]!;
              return (
                <button
                  key={index}
                  type="button"
                  className={`bs-cell ${cell.className}`}
                  disabled={disabled || !onCell}
                  onClick={() => onCell?.(index)}
                  aria-label={`${COLS[col]}${row + 1}${cell.label ? ` ${cell.label}` : ""}`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function BattleshipPlay({
  state,
  mySeat,
  myTurn,
  busy,
  onPlace,
  onFire,
}: BattleshipPlayProps) {
  const [draft, setDraft] = useState<ShipPlacement[]>([]);
  const [picked, setPicked] = useState<ShipId>("carrier");
  const [horizontal, setHorizontal] = useState(true);

  const mine = mySeat != null ? state.fleets[mySeat] : null;
  const foeSeat = mySeat === 1 ? 2 : mySeat === 2 ? 1 : null;
  const foe = foeSeat != null ? state.fleets[foeSeat] : null;
  const placing = state.phase === "placing";
  const ships = mine?.ready ? mine.ships : draft;
  const used = occupiedCells(ships);
  const last = state.lastShot;

  const shotCells = (fleet: Fleet | null | undefined, lastOnThis: boolean) =>
    Array.from({ length: GRID * GRID }, (_, index) => {
      const shot = fleet?.shotsAgainst.find((entry) => entry.index === index);
      const isLast = lastOnThis && last?.index === index;
      if (shot?.hit) {
        return { className: "is-hit" + (isLast ? " is-last" : ""), label: "hit" };
      }
      if (shot && !shot.hit) {
        return { className: "is-miss" + (isLast ? " is-last" : ""), label: "miss" };
      }
      return { className: "is-radar" };
    });

  const placeAt = (index: number) => {
    if (!placing || mine?.ready) return;
    const nextShip: ShipPlacement = { id: picked, origin: index, horizontal };
    const cells = shipCells(nextShip);
    if (cells.length !== specFor(picked).length) return;
    const others = ships.filter((ship) => ship.id !== picked);
    if (cells.some((cell) => occupiedCells(others).has(cell))) return;
    const next = [...others, nextShip];
    setDraft(next);
    const remaining = FLEET_SPEC.find((spec) => !next.some((ship) => ship.id === spec.id));
    if (remaining) setPicked(remaining.id);
  };

  const myCells = Array.from({ length: GRID * GRID }, (_, index) => {
    const shot = mine?.shotsAgainst.find((entry) => entry.index === index);
    const isLast = last?.attacker !== mySeat && last?.index === index;
    if (shot?.hit) {
      return { className: "is-hit" + (isLast ? " is-last" : ""), label: "hit" };
    }
    if (shot && !shot.hit) {
      return { className: "is-miss" + (isLast ? " is-last" : ""), label: "miss" };
    }
    if (used.has(index)) return { className: "is-ship", label: "ship" };
    return { className: "" };
  });

  const radarCells = shotCells(foe, last?.attacker === mySeat);

  if (mySeat == null) {
    return (
      <div className="bs-table">
        <div className="bs-boards">
          {state.players.map((entry) => (
            <Grid
              key={entry.id}
              title={`${entry.handle}'s waters`}
              cells={shotCells(state.fleets[entry.seat], last?.attacker !== entry.seat)}
            />
          ))}
        </div>
        {placing ? (
          <p className="bs-wait">Captains are placing their fleets.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bs-table">
      <div className="bs-boards">
        <Grid
          title="Your fleet"
          cells={myCells}
          disabled={busy || !placing || Boolean(mine?.ready)}
          onCell={placing && !mine?.ready ? placeAt : undefined}
        />
        {!placing || mine?.ready ? (
          <Grid
            title="Radar"
            cells={radarCells}
            disabled={busy || placing || !myTurn}
            onCell={!placing && myTurn ? onFire : undefined}
          />
        ) : null}
      </div>

      {placing && mySeat != null && !mine?.ready ? (
        <div className="bs-dock">
          <div className="bs-ships">
            {FLEET_SPEC.map((spec) => {
              const on = picked === spec.id;
              const done = ships.some((ship) => ship.id === spec.id);
              return (
                <button
                  key={spec.id}
                  type="button"
                  className={
                    "bs-ship" + (on ? " is-on" : "") + (done ? " is-done" : "")
                  }
                  onClick={() => setPicked(spec.id)}
                >
                  {spec.name} · {spec.length}
                </button>
              );
            })}
          </div>
          <div className="bs-actions">
            <button
              type="button"
              className="games-btn games-btn--ghost"
              onClick={() => setHorizontal((value) => !value)}
            >
              {horizontal ? "Rotate to vertical" : "Rotate to horizontal"}
            </button>
            <button
              type="button"
              className="games-btn games-btn--ghost"
              onClick={() => setDraft(randomFleet())}
            >
              Place randomly
            </button>
            <button
              type="button"
              className="games-btn"
              disabled={busy || ships.length !== FLEET_SPEC.length}
              onClick={() => onPlace(ships)}
            >
              Ready
            </button>
          </div>
        </div>
      ) : null}

      {placing && mine?.ready ? (
        <p className="bs-wait">Fleet locked in — waiting for the other captain.</p>
      ) : null}
    </div>
  );
}
