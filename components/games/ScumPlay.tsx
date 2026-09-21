"use client";

import { useMemo, useState } from "react";
import {
  cardRank,
  formatCard,
  isLegalAction,
  isRedSuit,
  sameSet,
  type ScumState,
} from "@/lib/games/scum";

type ScumPlayProps = {
  state: ScumState;
  mySeat: number | null;
  myTurn: boolean;
  busy: boolean;
  onPlay: (cards: number[]) => void;
  onPass: () => void;
};

export function ScumPlay({
  state,
  mySeat,
  myTurn,
  busy,
  onPlay,
  onPass,
}: ScumPlayProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const hand = mySeat != null ? (state.hands[mySeat] ?? []) : [];

  const selectionLegal = useMemo(() => {
    if (!myTurn || mySeat == null || selected.length === 0) return false;
    return isLegalAction(state, mySeat, { type: "play", cards: selected });
  }, [myTurn, mySeat, selected, state]);

  const toggle = (card: number) => {
    setSelected((current) => {
      if (current.includes(card)) return current.filter((id) => id !== card);
      const next = [...current, card];
      if (!sameSet(next) || cardRank(next[0]!) !== cardRank(card)) {
        return [card];
      }
      return next;
    });
  };

  const last = state.lastPlay;
  const lastLabel = last
    ? last.cards.map(formatCard).join("  ")
    : "Lead any single or equal set";

  return (
    <div className="scum-table">
      <div className="scum-trick">
        <p className="scum-trick__kicker">
          {last
            ? `${state.players.find((entry) => entry.seat === last.seat)?.handle ?? "Player"} played`
            : "New trick"}
        </p>
        <p className="scum-trick__cards">{lastLabel}</p>
        {state.passedSincePlay.length > 0 ? (
          <p className="scum-trick__pass">
            Passed:{" "}
            {state.passedSincePlay
              .map(
                (seat) =>
                  state.players.find((entry) => entry.seat === seat)?.handle ?? "?",
              )
              .join(", ")}
          </p>
        ) : null}
      </div>

      {mySeat != null ? (
        <>
          <div className="scum-hand">
            {hand.map((card) => {
              const on = selected.includes(card);
              return (
                <button
                  key={card}
                  type="button"
                  className={
                    "scum-card" +
                    (isRedSuit(card) ? " is-red" : "") +
                    (on ? " is-on" : "")
                  }
                  disabled={!myTurn || busy}
                  onClick={() => toggle(card)}
                  aria-pressed={on}
                  aria-label={formatCard(card)}
                >
                  <span>{formatCard(card)}</span>
                </button>
              );
            })}
          </div>
          <div className="scum-actions">
            <button
              type="button"
              className="games-btn"
              disabled={!selectionLegal || busy}
              onClick={() => {
                onPlay(selected);
                setSelected([]);
              }}
            >
              Play
            </button>
            <button
              type="button"
              className="games-btn games-btn--ghost"
              disabled={!myTurn || busy || last == null}
              onClick={() => {
                onPass();
                setSelected([]);
              }}
            >
              Pass
            </button>
          </div>
        </>
      ) : (
        <p className="scum-watch">Watching the table — no hand for you.</p>
      )}
    </div>
  );
}
