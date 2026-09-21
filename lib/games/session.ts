import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";
import { db, getDbClient } from "@/lib/db";
import { gameSessions } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { initialBoard, type Seat } from "./checkers";
import type { CheckersState, GameStatus, SessionSnapshot } from "./types";

/** 5-character join codes from an unambiguous alphabet (no 0/O/1/I). */
const createJoinCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function normalizeHandle(raw: string) {
  return raw.trim().replace(/\s+/g, " ").slice(0, 16);
}

function freshState(): CheckersState {
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

type SessionRow = typeof gameSessions.$inferSelect;

function snapshotFromRow(row: SessionRow): SessionSnapshot {
  return {
    code: row.code,
    status: row.status as GameStatus,
    version: row.version,
    state: JSON.parse(row.stateJson) as CheckersState,
  };
}

export async function createSession(
  hostId: string,
  hostHandle: string,
  hostSeat: Seat = 1,
) {
  const state = freshState();
  state.players.push({ id: hostId, handle: hostHandle, seat: hostSeat });

  // Retry on the (unlikely) code collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createJoinCode();
    try {
      const [row] = await db
        .insert(gameSessions)
        .values({
          id: createId(),
          code,
          game: "checkers",
          status: "waiting",
          stateJson: JSON.stringify(state),
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
  return { ...snapshot, version: expectedVersion + 1 };
}
