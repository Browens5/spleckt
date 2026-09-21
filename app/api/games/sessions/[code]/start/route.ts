export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { dealWaitingScum, getSessionByCode, saveSession } from "@/lib/games/session";

const startSchema = z.object({
  playerId: z.string().min(8).max(64),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  await ensureSchema();

  const { code } = await context.params;
  const parsed = startSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const snapshot = await getSessionByCode(code);
    if (!snapshot) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const host = snapshot.state.players[0];
    if (!host || host.id !== parsed.data.playerId) {
      return NextResponse.json(
        { error: "Only the organizer can deal" },
        { status: 403 },
      );
    }

    const dealt = dealWaitingScum(snapshot);
    if (!dealt.ok) {
      return NextResponse.json({ error: dealt.error }, { status: 409 });
    }

    const saved = await saveSession(snapshot, snapshot.version);
    if (saved) return NextResponse.json({ session: saved });
  }

  return NextResponse.json(
    { error: "Table is busy, try again" },
    { status: 409 },
  );
}
