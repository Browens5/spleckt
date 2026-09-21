export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema } from "@/lib/db/ensure-schema";
import {
  getSessionByCode,
  normalizeHandle,
  saveSession,
} from "@/lib/games/session";

const joinSchema = z.object({
  playerId: z.string().min(8).max(64),
  handle: z.string().min(2).max(24),
});

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

  // Retry a few times: concurrent joins race on the version check.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const snapshot = await getSessionByCode(code);
    if (!snapshot) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { state } = snapshot;

    // Already at the table (page refresh, reconnect) — nothing to change.
    if (
      state.players.some((entry) => entry.id === playerId) ||
      state.viewers.some((entry) => entry.id === playerId)
    ) {
      return NextResponse.json({ session: snapshot });
    }

    if (state.players.length < 2) {
      const taken = state.players[0]?.seat;
      state.players.push({
        id: playerId,
        handle,
        seat: taken === 1 ? 2 : 1,
      });
      snapshot.status = "playing";
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
