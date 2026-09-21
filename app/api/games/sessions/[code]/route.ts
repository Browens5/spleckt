export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { getSessionByCode, saveSession } from "@/lib/games/session";
import { advanceBots, needsBotTurn } from "@/lib/games/bots";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  await ensureSchema();

  const { code } = await context.params;
  const snapshot = await getSessionByCode(code);
  if (!snapshot) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (snapshot.status === "playing" && needsBotTurn(snapshot.state)) {
    advanceBots(snapshot);
    const saved = await saveSession(snapshot, snapshot.version);
    if (saved) return NextResponse.json({ session: saved });
  }

  return NextResponse.json({ session: snapshot });
}
