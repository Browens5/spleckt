"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  initialBoard,
  legalMoves,
  type Move,
} from "@/lib/games/checkers";
import {
  LOUNGE_TABLES,
  roleFor,
  type SessionSnapshot,
} from "@/lib/games/types";
import type { BoardHighlights, LoungeView } from "./LoungeCanvas";

const LoungeCanvas = dynamic(
  () => import("./LoungeCanvas").then((mod) => mod.LoungeCanvas),
  { ssr: false, loading: () => <div className="games-canvas-fallback" aria-hidden /> },
);

const PLAYER_KEY = "spleckt-games-player";
const POLL_MS = 1200;
const DEMO_BOARD = initialBoard();

type PlayerIdentity = {
  id: string;
  handle: string;
};

/** localStorage-backed identity, exposed as an external store. */
const playerListeners = new Set<() => void>();

function subscribePlayer(listener: () => void) {
  playerListeners.add(listener);
  return () => {
    playerListeners.delete(listener);
  };
}

function getPlayerRaw() {
  return window.localStorage.getItem(PLAYER_KEY);
}

function getServerPlayerRaw() {
  return null;
}

function parsePlayer(raw: string | null): PlayerIdentity | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlayerIdentity;
    if (typeof parsed.id === "string" && typeof parsed.handle === "string") {
      return parsed;
    }
  } catch {
    // corrupted entry — treat as signed out
  }
  return null;
}

function writePlayer(identity: PlayerIdentity) {
  window.localStorage.setItem(PLAYER_KEY, JSON.stringify(identity));
  playerListeners.forEach((listener) => listener());
}

type Overlay = "none" | "signin" | "table";

const TABLE = LOUNGE_TABLES[0];

export function GamesExperience() {
  const searchParams = useSearchParams();
  const sharedCode = searchParams.get("code");

  const playerRaw = useSyncExternalStore(
    subscribePlayer,
    getPlayerRaw,
    getServerPlayerRaw,
  );
  const player = useMemo(() => parsePlayer(playerRaw), [playerRaw]);

  const [overlay, setOverlay] = useState<Overlay>(sharedCode ? "table" : "none");
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [handleInput, setHandleInput] = useState("");
  const [codeInput, setCodeInput] = useState(() =>
    sharedCode ? sharedCode.toUpperCase().slice(0, 5) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const savePlayer = useCallback(
    (handle: string) => {
      const cleaned = handle.trim().replace(/\s+/g, " ").slice(0, 16);
      if (cleaned.length < 2) {
        setError("Handles need at least 2 characters.");
        return null;
      }
      const identity: PlayerIdentity = {
        id: player?.id ?? crypto.randomUUID(),
        handle: cleaned,
      };
      writePlayer(identity);
      setError(null);
      return identity;
    },
    [player?.id],
  );

  // ---- session polling -----------------------------------------------
  const activeCode = session?.code ?? null;
  useEffect(() => {
    if (!activeCode) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/games/sessions/${encodeURIComponent(activeCode)}`,
          { cache: "no-store" },
        );
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as { session: SessionSnapshot };
        if (cancelled || !data.session) return;
        setSession((current) =>
          !current || data.session.version > current.version
            ? data.session
            : current,
        );
      } catch {
        // transient network error — keep polling
      }
    };
    void tick();
    const interval = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeCode]);

  // ---- derived game state ---------------------------------------------
  const state = session?.state ?? null;
  const role = state && player ? roleFor(state, player.id) : { kind: "none" as const };
  const mySeat = role.kind === "player" ? role.seat : null;
  const myTurn =
    Boolean(state) &&
    session?.status === "playing" &&
    mySeat !== null &&
    state!.turnSeat === mySeat;

  const availableMoves = useMemo<Move[]>(() => {
    if (!state || !myTurn || mySeat === null) return [];
    return legalMoves(state.board, mySeat, state.continueFrom);
  }, [state, myTurn, mySeat]);

  // Mid multi-jump the mover has no choice of piece — force the selection.
  const effectiveSelected =
    myTurn && state?.continueFrom != null ? state.continueFrom : selected;

  const highlights = useMemo<BoardHighlights>(() => {
    const movable = Array.from(new Set(availableMoves.map((move) => move.from)));
    const targets =
      effectiveSelected !== null
        ? availableMoves
            .filter((move) => move.from === effectiveSelected)
            .map((move) => move.to)
        : [];
    return {
      movable,
      selected: effectiveSelected,
      targets,
      lastFrom: state?.lastMove?.from ?? null,
      lastTo: state?.lastMove?.to ?? null,
    };
  }, [availableMoves, effectiveSelected, state?.lastMove]);

  const view: LoungeView = session ? "game" : overlay === "table" ? "table" : "lounge";

  // ---- actions ----------------------------------------------------------
  const startGame = useCallback(
    async (identity: PlayerIdentity) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/games/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: identity.id,
            handle: identity.handle,
            game: TABLE.game,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not start the game");
        setSession(data.session as SessionSnapshot);
        setOverlay("none");
        setSelected(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start the game");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const joinGame = useCallback(
    async (identity: PlayerIdentity, code: string) => {
      const cleaned = code.trim().toUpperCase();
      if (cleaned.length !== 5) {
        setError("Game codes are 5 characters.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/games/sessions/${encodeURIComponent(cleaned)}/join`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: identity.id, handle: identity.handle }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not join the game");
        setSession(data.session as SessionSnapshot);
        setOverlay("none");
        setSelected(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not join the game");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const sendMove = useCallback(
    async (from: number, to: number) => {
      if (!activeCode || !player) return;
      setBusy(true);
      try {
        const res = await fetch(
          `/api/games/sessions/${encodeURIComponent(activeCode)}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: player.id, from, to }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Move rejected");
          return;
        }
        setError(null);
        setSelected(null);
        setSession(data.session as SessionSnapshot);
      } catch {
        setError("Network hiccup — try that move again.");
      } finally {
        setBusy(false);
      }
    },
    [activeCode, player],
  );

  const onSquareClick = useCallback(
    (index: number) => {
      // eslint-disable-next-line no-console
      console.log("[games-debug] onSquareClick", {
        index,
        hasState: Boolean(state),
        myTurn,
        busy,
        effectiveSelected,
        movableFroms: availableMoves.map((m) => m.from),
      });
      if (!state || !myTurn || busy) return;
      if (effectiveSelected !== null) {
        const move = availableMoves.find(
          (entry) => entry.from === effectiveSelected && entry.to === index,
        );
        if (move) {
          void sendMove(move.from, move.to);
          return;
        }
      }
      if (state.continueFrom != null) return; // must finish the jump
      if (availableMoves.some((move) => move.from === index)) {
        setSelected(index);
        return;
      }
      setSelected(null);
    },
    [state, myTurn, busy, effectiveSelected, availableMoves, sendMove],
  );

  const leaveTable = useCallback(() => {
    setSession(null);
    setSelected(null);
    setOverlay("none");
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const copyCode = useCallback(async () => {
    if (!session) return;
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("code", session.code);
    try {
      await navigator.clipboard.writeText(
        `Join my checkers game at Spleckt Games! Code ${session.code} — ${shareUrl.toString()}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — code stays visible in the HUD
    }
  }, [session]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (overlay !== "none") setOverlay("none");
        else setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  // ---- HUD content -----------------------------------------------------
  const seat1 = state?.players.find((entry) => entry.seat === 1) ?? null;
  const seat2 = state?.players.find((entry) => entry.seat === 2) ?? null;
  const winner =
    state?.winnerSeat != null
      ? state.players.find((entry) => entry.seat === state.winnerSeat) ?? null
      : null;

  let statusLine = "";
  if (session && state) {
    if (session.status === "waiting") {
      statusLine = `Share code ${session.code} — waiting for an opponent…`;
    } else if (session.status === "finished") {
      statusLine = winner
        ? `${winner.handle} wins the match!`
        : "Game over.";
    } else if (role.kind === "viewer" || role.kind === "none") {
      const mover = state.players.find((entry) => entry.seat === state.turnSeat);
      statusLine = `You're watching · ${mover?.handle ?? "?"} to move`;
    } else if (myTurn) {
      statusLine = state.continueFrom != null ? "Jump again!" : "Your move.";
    } else {
      const mover = state.players.find((entry) => entry.seat === state.turnSeat);
      statusLine = `${mover?.handle ?? "Opponent"} is thinking…`;
    }
  }

  return (
    <div className="games-experience">
      <div className="games-stage" aria-hidden={overlay !== "none"}>
        <LoungeCanvas
          view={view}
          board={state ? state.board : DEMO_BOARD}
          highlights={highlights}
          onDeskClick={() => {
            setHandleInput(player?.handle ?? "");
            setOverlay("signin");
          }}
          onTableClick={() => setOverlay("table")}
          onSquareClick={onSquareClick}
        />
      </div>

      <header className="games-chrome">
        <div>
          <h1>SPLECKT GAMES</h1>
          <p>groovy multiplayer board game lounge</p>
        </div>
        {player ? (
          <button
            type="button"
            className="games-badge"
            onClick={() => {
              setHandleInput(player.handle);
              setOverlay("signin");
            }}
            title="Change your handle at the front desk"
          >
            ★ {player.handle}
          </button>
        ) : (
          <button
            type="button"
            className="games-badge games-badge--muted"
            onClick={() => setOverlay("signin")}
          >
            Sign in at the front desk
          </button>
        )}
      </header>

      {!session && overlay === "none" ? (
        <p className="games-hint">
          {player
            ? "Pick a table to start or join a game."
            : "Click the front desk to sign in, then pick a table."}
        </p>
      ) : null}

      {/* ---- front desk sign-in ---- */}
      {overlay === "signin" ? (
        <div className="games-modal-backdrop" onClick={() => setOverlay("none")}>
          <form
            className="games-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const identity = savePlayer(handleInput);
              if (identity) setOverlay("none");
            }}
          >
            <p className="games-modal__kicker">FRONT DESK</p>
            <h2>Sign the guest book</h2>
            <p className="games-modal__copy">
              Pick a player handle — it&apos;s how friends will see you at the tables.
            </p>
            <input
              autoFocus
              value={handleInput}
              onChange={(event) => setHandleInput(event.target.value)}
              placeholder="Your player handle"
              maxLength={16}
              aria-label="Player handle"
            />
            {error ? <p className="games-error">{error}</p> : null}
            <div className="games-modal__actions">
              <button type="submit" className="games-btn">
                {player ? "Update handle" : "Sign in"}
              </button>
              <button
                type="button"
                className="games-btn games-btn--ghost"
                onClick={() => {
                  setError(null);
                  setOverlay("none");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* ---- table panel ---- */}
      {overlay === "table" && !session ? (
        <div className="games-modal-backdrop" onClick={() => setOverlay("none")}>
          <div className="games-modal" onClick={(event) => event.stopPropagation()}>
            <p className="games-modal__kicker">TABLE {TABLE.number}</p>
            <h2>{TABLE.gameName}</h2>
            <p className="games-modal__copy">{TABLE.tagline}</p>
            {player ? (
              <>
                <button
                  type="button"
                  className="games-btn games-btn--wide"
                  disabled={busy}
                  onClick={() => void startGame(player)}
                >
                  {busy ? "Setting the board…" : "Start a new game"}
                </button>
                <div className="games-join">
                  <input
                    value={codeInput}
                    onChange={(event) =>
                      setCodeInput(event.target.value.toUpperCase().slice(0, 5))
                    }
                    placeholder="ABCDE"
                    maxLength={5}
                    aria-label="Game code"
                  />
                  <button
                    type="button"
                    className="games-btn games-btn--gold"
                    disabled={busy || codeInput.length !== 5}
                    onClick={() => void joinGame(player, codeInput)}
                  >
                    Join with code
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="games-btn games-btn--wide"
                onClick={() => {
                  setHandleInput("");
                  setOverlay("signin");
                }}
              >
                Sign in at the front desk first
              </button>
            )}
            {error ? <p className="games-error">{error}</p> : null}
            <button
              type="button"
              className="games-modal__close"
              aria-label="Back to the lounge"
              onClick={() => {
                setError(null);
                setOverlay("none");
              }}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      {/* ---- in-game HUD ---- */}
      {session && state ? (
        <>
          <div className="games-code-chip">
            <span>CODE</span>
            <strong>{session.code}</strong>
            <button type="button" onClick={() => void copyCode()}>
              {copied ? "Copied!" : "Copy invite"}
            </button>
          </div>

          <aside className="games-scoreboard">
            <p className="games-scoreboard__title">
              Table {TABLE.number} · {TABLE.gameName}
            </p>
            <ul>
              <li
                className={
                  state.turnSeat === 1 && session.status === "playing"
                    ? "is-turn seat-1"
                    : "seat-1"
                }
              >
                <i />
                {seat1 ? seat1.handle : "…"}
                {mySeat === 1 ? <em>you</em> : null}
              </li>
              <li
                className={
                  state.turnSeat === 2 && session.status === "playing"
                    ? "is-turn seat-2"
                    : "seat-2"
                }
              >
                <i />
                {seat2 ? seat2.handle : "waiting for opponent…"}
                {mySeat === 2 ? <em>you</em> : null}
              </li>
            </ul>
            {state.viewers.length > 0 ? (
              <p className="games-scoreboard__viewers">
                👀 {state.viewers.map((entry) => entry.handle).join(", ")}
              </p>
            ) : null}
            <button
              type="button"
              className="games-btn games-btn--ghost games-btn--small"
              onClick={leaveTable}
            >
              Leave table
            </button>
          </aside>

          <p
            className={
              myTurn ? "games-status games-status--active" : "games-status"
            }
            aria-live="polite"
          >
            {statusLine}
          </p>
          {error ? <p className="games-error games-error--floating">{error}</p> : null}

          {session.status === "finished" ? (
            <div className="games-winner">
              <h2>{winner ? `${winner.handle} wins!` : "Game over"}</h2>
              <button type="button" className="games-btn" onClick={leaveTable}>
                Back to the lounge
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
