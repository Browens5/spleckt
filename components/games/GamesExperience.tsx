"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  capturedCount,
  initialBoard,
  legalMoves,
  type Move,
  type Seat,
} from "@/lib/games/checkers";
import {
  LOUNGE_TABLES,
  isBattleshipState,
  isCheckersState,
  isConnect4State,
  isScumState,
  roleFor,
  tableForGame,
  type SessionSnapshot,
  type TableInfo,
} from "@/lib/games/types";
import { MIN_PLAYERS as SCUM_MIN, rankTitle } from "@/lib/games/scum";
import { emptyFleet, remainingHull, specFor, type ShipPlacement } from "@/lib/games/battleship";
import { maxBotsFor, needsBotTurn } from "@/lib/games/bots";
import type { BoardHighlights, LoungeTableId, LoungeView } from "./LoungeCanvas";
import { ScumPlay } from "./ScumPlay";
import { BattleshipPlay } from "./BattleshipPlay";
import {
  bootJazzFromStorage,
  getJazzEnabled,
  playSfx,
  subscribeJazz,
  toggleJazz,
} from "./loungeAudio";

const LoungeCanvas = dynamic(
  () => import("./LoungeCanvas").then((mod) => mod.LoungeCanvas),
  { ssr: false, loading: () => <div className="games-canvas-fallback" aria-hidden /> },
);

const PLAYER_KEY = "spleckt-games-player";
const POLL_MS = 1200;
const BOT_POLL_MS = 400;
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
  const [hostSeat, setHostSeat] = useState<Seat>(1);
  const [hostBots, setHostBots] = useState(0);
  const sessionSfxRef = useRef<SessionSnapshot | null>(null);
  const jazzOn = useSyncExternalStore(subscribeJazz, getJazzEnabled, () => false);
  const [pickedTable, setPickedTable] = useState<TableInfo>(LOUNGE_TABLES[0]!);

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
  const waitingOnBot = Boolean(
    session && session.status === "playing" && needsBotTurn(session.state),
  );
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
    const interval = window.setInterval(tick, waitingOnBot ? BOT_POLL_MS : POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeCode, waitingOnBot]);

  // ---- derived game state ---------------------------------------------
  const state = session?.state ?? null;
  const checkers = state && isCheckersState(state) ? state : null;
  const scum = state && isScumState(state) ? state : null;
  const battleship = state && isBattleshipState(state) ? state : null;
  const connect4 = state && isConnect4State(state) ? state : null;
  const activeTable = state ? tableForGame(state.game) : pickedTable;
  const role = state && player ? roleFor(state, player.id) : { kind: "none" as const };
  const mySeat = role.kind === "player" ? role.seat : null;
  const myTurn =
    Boolean(state) &&
    session?.status === "playing" &&
    mySeat !== null &&
    (battleship?.phase === "placing"
      ? !battleship.fleets[mySeat]?.ready
      : state!.turnSeat === mySeat);
  const isHost = Boolean(player && state?.players[0]?.id === player.id);

  const availableMoves = useMemo<Move[]>(() => {
    if (!checkers || !myTurn || mySeat === null) return [];
    return legalMoves(checkers.board, mySeat === 2 ? 2 : 1, checkers.continueFrom);
  }, [checkers, myTurn, mySeat]);

  const effectiveSelected =
    myTurn && checkers?.continueFrom != null ? checkers.continueFrom : selected;

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
      lastFrom: checkers?.lastMove?.from ?? null,
      lastTo: checkers?.lastMove?.to ?? null,
    };
  }, [availableMoves, effectiveSelected, checkers?.lastMove]);

  const view: LoungeView = session ? "game" : overlay === "table" ? "table" : "lounge";
  const focusTable: LoungeTableId = session
    ? activeTable.id
    : overlay === "table"
      ? pickedTable.id
      : "table-1";

  // ---- actions ----------------------------------------------------------
  const startGame = useCallback(
    async (identity: PlayerIdentity, seat: Seat) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/games/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: identity.id,
            handle: identity.handle,
            game: pickedTable.game,
            seat,
            bots: hostBots,
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
    [pickedTable.game, hostBots],
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

  const sendBattleship = useCallback(
    async (
      body:
        | { action: "place"; ships: ShipPlacement[] }
        | { action: "fire"; index: number },
    ) => {
      if (!activeCode || !player) return;
      setBusy(true);
      try {
        const res = await fetch(
          `/api/games/sessions/${encodeURIComponent(activeCode)}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: player.id, ...body }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Shot rejected");
          return;
        }
        setError(null);
        setSession(data.session as SessionSnapshot);
      } catch {
        setError("Network hiccup — try that shot again.");
      } finally {
        setBusy(false);
      }
    },
    [activeCode, player],
  );

  const sendScum = useCallback(
    async (body: { action: "play"; cards: number[] } | { action: "pass" }) => {
      if (!activeCode || !player) return;
      setBusy(true);
      try {
        const res = await fetch(
          `/api/games/sessions/${encodeURIComponent(activeCode)}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: player.id, ...body }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Play rejected");
          return;
        }
        setError(null);
        setSession(data.session as SessionSnapshot);
      } catch {
        setError("Network hiccup — try that play again.");
      } finally {
        setBusy(false);
      }
    },
    [activeCode, player],
  );

  const sendConnect4 = useCallback(
    async (col: number) => {
      if (!activeCode || !player) return;
      setBusy(true);
      try {
        const res = await fetch(
          `/api/games/sessions/${encodeURIComponent(activeCode)}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: player.id, action: "drop", col }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Drop rejected");
          return;
        }
        setError(null);
        setSession(data.session as SessionSnapshot);
      } catch {
        setError("Network hiccup — try that drop again.");
      } finally {
        setBusy(false);
      }
    },
    [activeCode, player],
  );

  const dealScumTable = useCallback(async () => {
    if (!activeCode || !player) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/games/sessions/${encodeURIComponent(activeCode)}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: player.id }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not deal");
      setSession(data.session as SessionSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deal");
    } finally {
      setBusy(false);
    }
  }, [activeCode, player]);

  const onSquareClick = useCallback(
    (index: number) => {
      if (!checkers || !myTurn || busy) return;
      if (effectiveSelected !== null) {
        const move = availableMoves.find(
          (entry) => entry.from === effectiveSelected && entry.to === index,
        );
        if (move) {
          void sendMove(move.from, move.to);
          return;
        }
      }
      if (checkers.continueFrom != null) return;
      if (availableMoves.some((move) => move.from === index)) {
        setSelected(index);
        return;
      }
      setSelected(null);
    },
    [checkers, myTurn, busy, effectiveSelected, availableMoves, sendMove],
  );

  const onColumnClick = useCallback(
    (col: number) => {
      if (!connect4 || !myTurn || busy) return;
      void sendConnect4(col);
    },
    [connect4, myTurn, busy, sendConnect4],
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
        `Join my ${activeTable.gameName} game at Spleckt Games! Code ${session.code} — ${shareUrl.toString()}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — code stays visible in the HUD
    }
  }, [session, activeTable.gameName]);

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

  useEffect(() => {
    bootJazzFromStorage();
  }, []);

  useEffect(() => {
    if (!session) return;
    const prev = sessionSfxRef.current;
    sessionSfxRef.current = session;
    if (!prev || prev.code !== session.code) return;
    if (session.status === "finished" && prev.status !== "finished") {
      playSfx("win");
      return;
    }
    if (session.state.moveCount <= prev.state.moveCount) return;
    if (session.state.game === "connect4" || session.state.game === "checkers") {
      playSfx("drop");
    } else if (session.state.game === "scum") {
      playSfx("card");
    } else if (session.state.game === "battleship") {
      const shot = session.state.lastShot;
      const last = prev.state.game === "battleship" ? prev.state.lastShot : null;
      if (shot && shot !== last) {
        playSfx(shot.hit ? "hit" : "miss");
      } else {
        playSfx("place");
      }
    }
  }, [session]);

  useEffect(() => {
    if (!sharedCode) return;
    let cancelled = false;
    void fetch(`/api/games/sessions/${encodeURIComponent(sharedCode)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { session?: SessionSnapshot } | null) => {
        if (cancelled || !data?.session) return;
        setPickedTable(tableForGame(data.session.state.game));
      })
      .catch(() => {
        // unknown code — table overlay still lets them type it
      });
    return () => {
      cancelled = true;
    };
  }, [sharedCode]);

  // ---- HUD content -----------------------------------------------------
  const seat1 = checkers?.players.find((entry) => entry.seat === 1) ?? null;
  const seat2 = checkers?.players.find((entry) => entry.seat === 2) ?? null;
  const score1 = checkers ? capturedCount(checkers.board, 1) : 0;
  const score2 = checkers ? capturedCount(checkers.board, 2) : 0;
  const winner =
    checkers?.winnerSeat != null
      ? checkers.players.find((entry) => entry.seat === checkers.winnerSeat) ?? null
      : battleship?.winnerSeat != null
        ? battleship.players.find((entry) => entry.seat === battleship.winnerSeat) ?? null
        : connect4?.winnerSeat
          ? connect4.players.find((entry) => entry.seat === connect4.winnerSeat) ?? null
          : null;
  const connect4Draw = Boolean(connect4 && session?.status === "finished" && connect4.winnerSeat === 0);
  const scumPresident =
    scum && scum.finishOrder[0] != null
      ? scum.players.find((entry) => entry.seat === scum.finishOrder[0]) ?? null
      : scum && (scum.lastFinishOrder?.[0] != null)
        ? scum.players.find((entry) => entry.seat === scum.lastFinishOrder[0]) ?? null
        : null;

  let statusLine = "";
  if (session && state) {
    if (session.status === "waiting") {
      statusLine = scum
        ? `Share code ${session.code} — ${state.players.length}/${SCUM_MIN}+ to deal`
        : `Share code ${session.code} — waiting for an opponent…`;
    } else if (session.status === "finished") {
      if (connect4Draw) statusLine = "The well is full — draw.";
      else if (winner) statusLine = `${winner.handle} wins the match!`;
      else statusLine = "Game over.";
    } else if (role.kind === "viewer" || role.kind === "none") {
      const mover = state.players.find((entry) => entry.seat === state.turnSeat);
      statusLine = `You're watching · ${mover?.handle ?? "?"} to play`;
    } else if (myTurn) {
      if (checkers?.continueFrom != null) statusLine = "Jump again!";
      else if (battleship?.phase === "placing") statusLine = "Place your fleet.";
      else if (battleship) statusLine = "Take a shot on the radar.";
      else if (connect4) statusLine = "Drop a disc.";
      else if (scum && !scum.lastPlay) {
        statusLine = scumPresident
          ? `Round ${scum.round ?? 1} — ${scumPresident.handle} is President. Lead any set.`
          : "Lead any single or equal set.";
      }
      else statusLine = "Your play.";
    } else {
      if (battleship?.phase === "placing") {
        statusLine = "Waiting for the other captain to place ships…";
      } else if (battleship?.lastShot) {
        const shot = battleship.lastShot;
        const who =
          shot.attacker === mySeat
            ? "You"
            : (battleship.players.find((entry) => entry.seat === shot.attacker)?.handle ??
              "Opponent");
        const result = shot.sunk
          ? `sunk the ${specFor(shot.sunk).name}!`
          : shot.hit
            ? "scored a hit."
            : "missed.";
        statusLine = `${who} ${result}`;
      } else {
        const mover = state.players.find((entry) => entry.seat === state.turnSeat);
        statusLine = `${mover?.handle ?? "Opponent"} is thinking…`;
      }
    }
  }

  return (
    <div className="games-experience">
      <div className="games-stage" aria-hidden={overlay !== "none"}>
        <LoungeCanvas
          view={view}
          focusTable={focusTable}
          board={checkers ? checkers.board : DEMO_BOARD}
          highlights={highlights}
          facingSeat={checkers ? (mySeat === 2 ? 2 : 1) : null}
          showTrophy={Boolean(checkers) && session?.status === "finished"}
          connect4Board={connect4 ? connect4.board : null}
          connect4Last={connect4?.lastDrop?.index ?? null}
          onDeskClick={() => {
            setHandleInput(player?.handle ?? "");
            setOverlay("signin");
          }}
          onTableClick={(tableId) => {
            const table = LOUNGE_TABLES.find((entry) => entry.id === tableId);
            if (table) {
              setPickedTable(table);
              setHostBots(0);
            }
            setOverlay("table");
          }}
          onSquareClick={onSquareClick}
          onColumnClick={onColumnClick}
          onJukeboxClick={() => toggleJazz()}
        />
      </div>

      <header className="games-chrome">
        <div>
          <h1>SPLECKT GAMES</h1>
          <p>groovy multiplayer board game lounge</p>
        </div>
        <div className="games-chrome__tools">
          <button
            type="button"
            className={jazzOn ? "games-badge is-on" : "games-badge games-badge--muted"}
            onClick={() => toggleJazz()}
            title="Toggle lounge jazz (or click the jukebox)"
          >
            {jazzOn ? "♪ Jazz on" : "♪ Jazz off"}
          </button>
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
        </div>
      </header>

      {!session && overlay === "none" ? (
        <p className="games-hint">
          {player
            ? "Pick a table to start or join a game. Drag to look around. Click the jukebox for jazz."
            : "Click the front desk to sign in, then pick a table. Drag to look around."}
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
            <p className="games-modal__kicker">TABLE {pickedTable.number}</p>
            <h2>{pickedTable.gameName}</h2>
            <p className="games-modal__copy">{pickedTable.tagline}</p>
            {player ? (
              <>
                {pickedTable.game === "checkers" ? (
                  <div className="games-color-pick">
                    <p>I&apos;ll play as</p>
                    <div>
                      <button
                        type="button"
                        className={
                          hostSeat === 1
                            ? "games-color games-color--red is-on"
                            : "games-color games-color--red"
                        }
                        onClick={() => setHostSeat(1)}
                      >
                        Red
                      </button>
                      <button
                        type="button"
                        className={
                          hostSeat === 2
                            ? "games-color games-color--black is-on"
                            : "games-color games-color--black"
                        }
                        onClick={() => setHostSeat(2)}
                      >
                        Black
                      </button>
                    </div>
                  </div>
                ) : pickedTable.game === "scum" ? (
                  <p className="games-modal__copy">
                    Invite friends or seat computers. Hands keep going while you stay
                    seated. Ace is high, 2 is low. After each round the President takes
                    Scum&apos;s best cards. The organizer deals the first hand.
                  </p>
                ) : pickedTable.game === "connect4" ? (
                  <p className="games-modal__copy">
                    Two players drop discs down a 7×6 well. Four in a row wins. Play on
                    the standing board — click a column to drop. Seat a computer for a
                    solo game.
                  </p>
                ) : (
                  <p className="games-modal__copy">
                    Two captains. Place Carrier, Battleship, Cruiser, Submarine, and
                    Destroyer, then take turns firing one shot. Sink the whole fleet to win.
                  </p>
                )}
                <div className="games-bots">
                  <p>Computers</p>
                  <div>
                    <button
                      type="button"
                      className="games-btn games-btn--ghost games-btn--small"
                      disabled={hostBots <= 0}
                      onClick={() => setHostBots((value) => Math.max(0, value - 1))}
                    >
                      –
                    </button>
                    <strong>{hostBots}</strong>
                    <button
                      type="button"
                      className="games-btn games-btn--ghost games-btn--small"
                      disabled={hostBots >= maxBotsFor(pickedTable.game)}
                      onClick={() =>
                        setHostBots((value) =>
                          Math.min(maxBotsFor(pickedTable.game), value + 1),
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <span>
                    {pickedTable.game === "scum"
                      ? "Up to five. Deal as soon as three seats are filled."
                      : "0 or 1. One computer starts the match immediately."}
                  </span>
                </div>
                <button
                  type="button"
                  className="games-btn games-btn--wide"
                  disabled={busy}
                  onClick={() =>
                    void startGame(
                      player,
                      pickedTable.game === "checkers" ? hostSeat : 1,
                    )
                  }
                >
                  {busy
                    ? "Opening the table…"
                    : hostBots > 0
                      ? "Play with computers"
                      : pickedTable.game === "checkers"
                        ? "Start a new game"
                        : "Open the table"}
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

          <aside className={scum || battleship || connect4 ? "games-scoreboard games-scoreboard--wide" : "games-scoreboard"}>
            <p className="games-scoreboard__title">
              Table {activeTable.number} · {activeTable.gameName}
              {scum && (scum.round ?? 1) > 1 ? ` · Round ${scum.round}` : ""}
            </p>
            <ul>
              {state.players.map((entry, index) => {
                const cardsLeft = scum
                  ? (scum.hands[entry.seat] ?? []).length
                  : entry.seat === 1
                    ? score1
                    : score2;
                const finishedPlace = scum
                  ? scum.finishOrder.indexOf(entry.seat) + 1
                  : 0;
                const lastPlace = scum
                  ? (scum.lastFinishOrder ?? []).indexOf(entry.seat) + 1
                  : 0;
                const title = scum
                  ? finishedPlace > 0
                    ? rankTitle(finishedPlace, state.players.length)
                    : lastPlace > 0
                      ? `${rankTitle(lastPlace, state.players.length)} · ${cardsLeft}`
                      : `${cardsLeft} card${cardsLeft === 1 ? "" : "s"}`
                  : battleship
                    ? battleship.phase === "placing"
                      ? battleship.fleets[entry.seat]?.ready
                        ? "ready"
                        : "placing"
                      : `${remainingHull(battleship.fleets[entry.seat] ?? emptyFleet())} hull`
                    : connect4
                      ? `${connect4.board.filter((cell) => cell === entry.seat).length} discs`
                      : String(cardsLeft);
                const isTurn =
                  session.status === "playing" &&
                  (battleship?.phase === "placing"
                    ? !battleship.fleets[entry.seat]?.ready
                    : entry.seat === state.turnSeat);
                return (
                  <li
                    key={entry.id}
                    className={(isTurn ? "is-turn " : "") + `seat-${(index % 2) + 1}`}
                  >
                    <i />
                    <span>
                      {entry.handle}
                      {"bot" in entry && entry.bot ? <em>cpu</em> : null}
                      {mySeat === entry.seat ? <em>you</em> : null}
                    </span>
                    <b
                      title={
                        scum
                          ? "cards left / rank"
                          : battleship
                            ? "fleet hull remaining"
                            : "captures"
                      }
                    >
                      {title}
                    </b>
                  </li>
                );
              })}
              {checkers && state.players.length < 2 ? (
                <li className="seat-2">
                  <i />
                  <span>waiting for opponent…</span>
                  <b>0</b>
                </li>
              ) : null}
              {connect4 && state.players.length < 2 ? (
                <li className="seat-2">
                  <i />
                  <span>waiting for opponent…</span>
                  <b>—</b>
                </li>
              ) : null}
            </ul>
            {scum && session.status === "waiting" && isHost ? (
              <button
                type="button"
                className="games-btn games-btn--small"
                disabled={busy || state.players.length < SCUM_MIN}
                onClick={() => void dealScumTable()}
              >
                {state.players.length < SCUM_MIN
                  ? `Need ${SCUM_MIN - state.players.length} more`
                  : "Deal the cards"}
              </button>
            ) : null}
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

          {scum && session.status === "playing" ? (
            <ScumPlay
              state={scum}
              mySeat={mySeat}
              myTurn={myTurn}
              busy={busy}
              onPlay={(cards) => void sendScum({ action: "play", cards })}
              onPass={() => void sendScum({ action: "pass" })}
            />
          ) : null}

          {battleship && session.status === "playing" ? (
            <BattleshipPlay
              state={battleship}
              mySeat={mySeat}
              myTurn={myTurn}
              busy={busy}
              onPlace={(ships) => void sendBattleship({ action: "place", ships })}
              onFire={(index) => void sendBattleship({ action: "fire", index })}
            />
          ) : null}

          <p
            className={
              (myTurn ? "games-status games-status--active" : "games-status") +
              (scum && session.status === "playing" ? " games-status--scum" : "") +
              (battleship && session.status === "playing" ? " games-status--bs" : "")
            }
            aria-live="polite"
          >
            {statusLine}
          </p>
          {error ? <p className="games-error games-error--floating">{error}</p> : null}

          {session.status === "finished" ? (
            <div className="games-winner">
              <div className="games-trophy" aria-hidden>
                <span className="games-trophy__cup">🏆</span>
              </div>
              <h2>
                {scumPresident
                  ? `${scumPresident.handle} is President!`
                  : connect4Draw
                    ? "It's a draw!"
                    : winner
                      ? `${winner.handle} wins!`
                      : "Game over"}
              </h2>
              {scum ? (
                <ol className="games-winner__ranks">
                  {scum.finishOrder.map((seat, index) => {
                    const who = scum.players.find((entry) => entry.seat === seat);
                    return (
                      <li key={seat}>
                        {rankTitle(index + 1, scum.players.length)} — {who?.handle ?? "?"}
                      </li>
                    );
                  })}
                </ol>
              ) : battleship ? (
                <p className="games-winner__score">Fleet destroyed.</p>
              ) : connect4 ? (
                <p className="games-winner__score">
                  {connect4Draw ? "The well is packed." : "Four in a row."}
                </p>
              ) : (
                <p className="games-winner__score">
                  {seat1?.handle ?? "Red"} {score1} – {score2} {seat2?.handle ?? "Black"}
                </p>
              )}
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
