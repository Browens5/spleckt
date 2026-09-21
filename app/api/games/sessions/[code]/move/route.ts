export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { applyMove, findMove, legalMoves } from "@/lib/games/checkers";
import { applyScumAction } from "@/lib/games/scum";
import { getSessionByCode, saveSession } from "@/lib/games/session";

const moveSchema = z.union([
  z.object({
    playerId: z.string().min(8).max(64),
    from: z.number().int().min(0).max(63),
    to: z.number().int().min(0).max(63),
  }),
  z.object({
    playerId: z.string().min(8).max(64),
    action: z.literal("play"),
    cards: z.array(z.number().int().min(0).max(51)).min(1).max(4),
  }),
  z.object({
    playerId: z.string().min(8).max(64),
    action: z.literal("pass"),
  }),
]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  await ensureSchema();

  const { code } = await context.params;
  const parsed = moveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const snapshot = await getSessionByCode(code);
  if (!snapshot) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { state } = snapshot;
  if (snapshot.status !== "playing") {
    return NextResponse.json(
      { error: snapshot.status === "waiting" ? "Waiting for an opponent" : "Game is over" },
      { status: 409 },
    );
  }

  const player = state.players.find((entry) => entry.id === parsed.data.playerId);
  if (!player) {
    return NextResponse.json({ error: "Viewers cannot move" }, { status: 403 });
  }
  if (player.seat !== state.turnSeat) {
    return NextResponse.json({ error: "Not your turn" }, { status: 409 });
  }

  if (state.game === "checkers") {
    if (!("from" in parsed.data)) {
      return NextResponse.json({ error: "Illegal move" }, { status: 422 });
    }
    const moves = legalMoves(state.board, player.seat === 2 ? 2 : 1, state.continueFrom);
    const move = findMove(moves, parsed.data.from, parsed.data.to);
    if (!move) {
      return NextResponse.json({ error: "Illegal move" }, { status: 422 });
    }
    const result = applyMove(state.board, player.seat === 2 ? 2 : 1, move);
    state.board = result.board;
    state.turnSeat = result.nextSeat;
    state.continueFrom = result.continueFrom;
    state.winnerSeat = result.winner;
    state.moveCount += 1;
    state.lastMove = move;
    if (result.winner) snapshot.status = "finished";
  } else {
    if (!("action" in parsed.data)) {
      return NextResponse.json({ error: "Illegal play" }, { status: 422 });
    }
    const action =
      parsed.data.action === "pass"
        ? { type: "pass" as const }
        : { type: "play" as const, cards: parsed.data.cards };
    const result = applyScumAction(state, player.seat, action);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    if (result.finished) snapshot.status = "finished";
  }

  const saved = await saveSession(snapshot, snapshot.version);
  if (!saved) {
    return NextResponse.json(
      { error: "Move conflict, refresh and retry" },
      { status: 409 },
    );
  }

  return NextResponse.json({ session: saved });
}
