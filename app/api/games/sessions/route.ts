export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { createSession, normalizeHandle } from "@/lib/games/session";

const createSchema = z.object({
  playerId: z.string().min(8).max(64),
  handle: z.string().min(2).max(24),
  game: z.literal("checkers"),
});

export async function POST(request: NextRequest) {
  await ensureSchema();

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const handle = normalizeHandle(parsed.data.handle);
  if (handle.length < 2) {
    return NextResponse.json({ error: "Handle too short" }, { status: 400 });
  }

  const snapshot = await createSession(parsed.data.playerId, handle);
  return NextResponse.json({ session: snapshot });
}
