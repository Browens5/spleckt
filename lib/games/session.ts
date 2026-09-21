import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";
import { db, getDbClient } from "@/lib/db";
import { gameSessions } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { initialBoard, type Seat } from "./checkers";
import { emptyBattleshipState } from "./battleship";
import { emptyConnect4State } from "./connect4";
import { dealScum, emptyScumState, MAX_PLAYERS as SCUM_MAX, MIN_PLAYERS as SCUM_MIN } from "./scum";
import { maxBotsFor, seatBots } from "./bots";
import type {
  CheckersState,
  GameId,
  GameStatus,
  SessionSnapshot,
} from "./types";

/** 5-character join codes from an unambiguous alphabet (no 0/O/1/I). */
const createJoinCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function normalizeHandle(raw: string) {
  return raw.trim().replace(/\s+/g, " ").slice(0, 16);
}

function freshCheckers(): CheckersState {
  return {
    game: "checkers",
    players: [],
    viewers: [],
    board: initialBoard(),
    turnSeat: 1,
    continueFrom: null,
    winnerSeat: null,
    moveCount: 0,
    lastMove: null,
  };
}

export function maxPlayersFor(game: GameId) {
  return game === "scum" ? SCUM_MAX : 2;
}

export function minPlayersFor(game: GameId) {
  return game === "scum" ? SCUM_MIN : 2;
}

type SessionRow = typeof gameSessions.$inferSelect;

function timestampMs(value: Date | number | null | undefined) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return Date.now();
}

function snapshotFromRow(row: SessionRow): SessionSnapshot {
  return {
    code: row.code,
    status: row.status as GameStatus,
    version: row.version,
    state: JSON.parse(row.stateJson) as SessionSnapshot["state"],
    updatedAt: timestampMs(row.updatedAt),
  };
}

export async function createSession(
  hostId: string,
  hostHandle: string,
  game: GameId = "checkers",
  hostSeat: Seat = 1,
  bots = 0,
) {
  const state =
    game === "scum"
      ? emptyScumState()
      : game === "battleship"
        ? emptyBattleshipState()
        : game === "connect4"
          ? emptyConnect4State()
          : freshCheckers();
  if (state.game === "scum") {
    state.players.push({ id: hostId, handle: hostHandle, seat: 1 });
    state.dealerSeat = 1;
    state.turnSeat = 1;
  } else if (state.game === "battleship" || state.game === "connect4") {
    state.players.push({ id: hostId, handle: hostHandle, seat: 1 });
  } else {
    state.players.push({ id: hostId, handle: hostHandle, seat: hostSeat });
  }
  seatBots(state, Math.min(Math.max(0, bots), maxBotsFor(game)));

  let status: GameStatus = "waiting";
  if (
    (state.game === "checkers" ||
      state.game === "battleship" ||
      state.game === "connect4") &&
    state.players.length >= 2
  ) {
    status = "playing";
  } else if (state.game === "scum" && state.players.length >= SCUM_MIN && bots > 0) {
    dealScum(state);
    status = "playing";
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createJoinCode();
    try {
      const snapshot: SessionSnapshot = {
        code,
        status,
        version: 1,
        state,
      };
      const [row] = await db
        .insert(gameSessions)
        .values({
          id: createId(),
          code,
          game,
          status: snapshot.status,
          stateJson: JSON.stringify(snapshot.state),
          version: 1,
        })
        .returning();
      return snapshotFromRow(row);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("UNIQUE")) throw error;
    }
  }
  throw new Error("Could not allocate a unique game code");
}

export async function getSessionByCode(code: string) {
  const [row] = await db
    .select()
    .from(gameSessions)
    .where(eq(gameSessions.code, normalizeCode(code)))
    .limit(1);
  return row ? snapshotFromRow(row) : null;
}

/**
 * Persists a mutated snapshot. Uses an optimistic version check so two
 * simultaneous writes cannot clobber each other; returns false on conflict.
 */
export async function saveSession(
  snapshot: SessionSnapshot,
  expectedVersion: number,
) {
  const result = await getDbClient().execute({
    sql: `UPDATE game_sessions
          SET state_json = ?, status = ?, version = ?, updated_at = ?
          WHERE code = ? AND version = ?`,
    args: [
      JSON.stringify(snapshot.state),
      snapshot.status,
      expectedVersion + 1,
      Date.now(),
      snapshot.code,
      expectedVersion,
    ],
  });
  if (result.rowsAffected === 0) return null;
  return { ...snapshot, version: expectedVersion + 1, updatedAt: Date.now() };
}

export function dealWaitingScum(snapshot: SessionSnapshot) {
  if (snapshot.state.game !== "scum") {
    return { ok: false as const, error: "Not a Scum table" };
  }
  if (snapshot.status !== "waiting") {
    return { ok: false as const, error: "Cards are already out" };
  }
  if (snapshot.state.players.length < SCUM_MIN) {
    return {
      ok: false as const,
      error: `Scum needs at least ${SCUM_MIN} players`,
    };
  }
  dealScum(snapshot.state);
  snapshot.status = "playing";
  return { ok: true as const };
}
