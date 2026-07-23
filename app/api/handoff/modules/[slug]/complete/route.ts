import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { getModuleBySlug, markModuleComplete, startModuleProgress } from "@/lib/handoff/training";
import { getSession } from "@/lib/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  await ensureSchema();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const mod = await getModuleBySlug(slug);
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  await startModuleProgress(session.user.id, mod.id);
  const progress = await markModuleComplete(session.user.id, mod.id);
  return NextResponse.json({ progress });
}
