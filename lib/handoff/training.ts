import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  trainingAttempts,
  trainingCertifications,
  trainingModules,
  trainingProgress,
  trainingTests,
} from "@/lib/db/schema";
import { createCertificateCode, createId } from "@/lib/ids";
import {
  parseTrainingQuestions,
  scoreAttempt,
  toPublicQuestions,
  type TrainingQuestion,
} from "@/lib/handoff/types";

export async function listPublishedModules() {
  return db
    .select()
    .from(trainingModules)
    .where(eq(trainingModules.isPublished, true))
    .orderBy(asc(trainingModules.sortOrder), asc(trainingModules.title));
}

export async function getModuleBySlug(slug: string) {
  const rows = await db
    .select()
    .from(trainingModules)
    .where(and(eq(trainingModules.slug, slug), eq(trainingModules.isPublished, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getTestForModule(moduleId: string) {
  const rows = await db
    .select()
    .from(trainingTests)
    .where(eq(trainingTests.moduleId, moduleId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProgressMap(userId: string) {
  const rows = await db
    .select()
    .from(trainingProgress)
    .where(eq(trainingProgress.userId, userId));
  return new Map(rows.map((row) => [row.moduleId, row]));
}

export async function getCertificationMap(userId: string) {
  const rows = await db
    .select()
    .from(trainingCertifications)
    .where(eq(trainingCertifications.userId, userId));
  return new Map(rows.map((row) => [row.moduleId, row]));
}

export async function listUserCertifications(userId: string) {
  return db
    .select({
      id: trainingCertifications.id,
      code: trainingCertifications.code,
      issuedAt: trainingCertifications.issuedAt,
      moduleId: trainingModules.id,
      moduleTitle: trainingModules.title,
      moduleSlug: trainingModules.slug,
      moduleKind: trainingModules.kind,
    })
    .from(trainingCertifications)
    .innerJoin(
      trainingModules,
      eq(trainingCertifications.moduleId, trainingModules.id),
    )
    .where(eq(trainingCertifications.userId, userId))
    .orderBy(desc(trainingCertifications.issuedAt));
}

export async function markModuleComplete(userId: string, moduleId: string) {
  const existing = await db
    .select()
    .from(trainingProgress)
    .where(
      and(
        eq(trainingProgress.userId, userId),
        eq(trainingProgress.moduleId, moduleId),
      ),
    )
    .limit(1);

  const now = new Date();
  if (existing[0]) {
    if (existing[0].status === "completed") {
      return existing[0];
    }
    await db
      .update(trainingProgress)
      .set({
        status: "completed",
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(trainingProgress.id, existing[0].id));
    return {
      ...existing[0],
      status: "completed" as const,
      completedAt: now,
      updatedAt: now,
    };
  }

  const row = {
    id: createId(),
    userId,
    moduleId,
    status: "completed",
    completedAt: now,
    updatedAt: now,
  };
  await db.insert(trainingProgress).values(row);
  return row;
}

export async function startModuleProgress(userId: string, moduleId: string) {
  const existing = await db
    .select()
    .from(trainingProgress)
    .where(
      and(
        eq(trainingProgress.userId, userId),
        eq(trainingProgress.moduleId, moduleId),
      ),
    )
    .limit(1);

  if (existing[0]) return existing[0];

  const now = new Date();
  const row = {
    id: createId(),
    userId,
    moduleId,
    status: "in_progress",
    completedAt: null,
    updatedAt: now,
  };
  await db.insert(trainingProgress).values(row);
  return row;
}

export function getPublicTestPayload(test: typeof trainingTests.$inferSelect) {
  const questions = parseTrainingQuestions(test.questionsJson);
  return {
    id: test.id,
    title: test.title,
    passingScore: test.passingScore,
    questions: toPublicQuestions(questions),
  };
}

export async function submitTestAttempt(input: {
  userId: string;
  testId: string;
  answers: Array<{ questionId: string; choiceIndex: number }>;
}) {
  const tests = await db
    .select()
    .from(trainingTests)
    .where(eq(trainingTests.id, input.testId))
    .limit(1);
  const test = tests[0];
  if (!test) {
    throw new Error("TEST_NOT_FOUND");
  }

  const questions: TrainingQuestion[] = parseTrainingQuestions(test.questionsJson);
  const { score } = scoreAttempt(questions, input.answers);
  const passed = score >= test.passingScore;
  const now = new Date();

  const attempt = {
    id: createId(),
    userId: input.userId,
    testId: test.id,
    score,
    passed,
    answersJson: JSON.stringify(input.answers),
    createdAt: now,
  };
  await db.insert(trainingAttempts).values(attempt);

  let certification: typeof trainingCertifications.$inferSelect | null = null;

  if (passed) {
    await markModuleComplete(input.userId, test.moduleId);

    const existingCert = await db
      .select()
      .from(trainingCertifications)
      .where(
        and(
          eq(trainingCertifications.userId, input.userId),
          eq(trainingCertifications.moduleId, test.moduleId),
        ),
      )
      .limit(1);

    if (existingCert[0]) {
      certification = existingCert[0];
    } else {
      certification = {
        id: createId(),
        userId: input.userId,
        moduleId: test.moduleId,
        attemptId: attempt.id,
        code: `HO-${createCertificateCode()}`,
        issuedAt: now,
      };
      await db.insert(trainingCertifications).values(certification);
    }
  }

  return {
    attemptId: attempt.id,
    score,
    passed,
    passingScore: test.passingScore,
    certification: certification
      ? {
          id: certification.id,
          code: certification.code,
          issuedAt: certification.issuedAt,
        }
      : null,
  };
}
