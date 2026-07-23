import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db/ensure-schema";
import { trainingTests } from "@/lib/db/schema";
import { submitTestAttempt } from "@/lib/handoff/training";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        choiceIndex: z.number().int().min(0),
      }),
    )
    .min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await ensureSchema();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const tests = await db
    .select({ id: trainingTests.id })
    .from(trainingTests)
    .where(eq(trainingTests.id, id))
    .limit(1);
  if (!tests[0]) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid answers payload" }, { status: 400 });
  }

  try {
    const result = await submitTestAttempt({
      userId: session.user.id,
      testId: id,
      answers: parsed.data.answers,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to score attempt" }, { status: 500 });
  }
}
