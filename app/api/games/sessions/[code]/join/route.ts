export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema } from "@/lib/db/ensure-schema";
import {
  getSessionByCode,
  maxPlayersFor,
  normalizeHandle,
  saveSession,
} from "@/lib/games/session";

const joinSchema = z.object({
  playerId: z.string().min(8).max(64),
  handle: z.string().min(2).max(24),
});

function nextSeat(taken: number[]) {
  const used = new Set(taken);
  let seat = 1;
  while (used.has(seat)) seat += 1;
  return seat;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  await ensureSchema();

  const { code } = await context.params;
  const parsed = joinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const playerId = parsed.data.playerId;
  const handle = normalizeHandle(parsed.data.handle);
  if (handle.length < 2) {
    return NextResponse.json({ error: "Handle too short" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const snapshot = await getSessionByCode(code);
    if (!snapshot) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { state } = snapshot;

    if (
      state.players.some((entry) => entry.id === playerId) ||
      state.viewers.some((entry) => entry.id === playerId)
    ) {
      return NextResponse.json({ session: snapshot });
    }

    const cap = maxPlayersFor(state.game);
    if (state.players.length < cap && snapshot.status === "waiting") {
      state.players.push({
        id: playerId,
        handle,
        seat: nextSeat(state.players.map((entry) => entry.seat)),
      });
      if (
        (state.game === "checkers" || state.game === "battleship") &&
        state.players.length >= 2
      ) {
        snapshot.status = "playing";
      }
    } else {
      state.viewers.push({ id: playerId, handle });
    }

    const saved = await saveSession(snapshot, snapshot.version);
    if (saved) return NextResponse.json({ session: saved });
  }

  return NextResponse.json(
    { error: "Table is busy, try again" },
    { status: 409 },
  );
}
