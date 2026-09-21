export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { getSessionByCode } from "@/lib/games/session";

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

  return NextResponse.json({ session: snapshot });
}
