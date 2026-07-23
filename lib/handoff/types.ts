export type TrainingKind = "module" | "tool" | "software" | "technique";

export type TrainingQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
};

export type PublicTrainingQuestion = Omit<TrainingQuestion, "correctIndex">;

export type ModuleProgressStatus = "not_started" | "in_progress" | "completed";

export function normalizeTrainingKind(kind?: string | null): TrainingKind {
  if (
    kind === "module" ||
    kind === "tool" ||
    kind === "software" ||
    kind === "technique"
  ) {
    return kind;
  }
  return "module";
}

export function parseTrainingQuestions(raw: string | null | undefined): TrainingQuestion[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const choices = Array.isArray(row.choices)
          ? row.choices.map((c) => String(c))
          : [];
        const correctIndex = Number(row.correctIndex);
        if (!row.id || !row.prompt || choices.length < 2 || Number.isNaN(correctIndex)) {
          return null;
        }
        return {
          id: String(row.id),
          prompt: String(row.prompt),
          choices,
          correctIndex,
        } satisfies TrainingQuestion;
      })
      .filter((q): q is TrainingQuestion => Boolean(q));
  } catch {
    return [];
  }
}

export function toPublicQuestions(questions: TrainingQuestion[]): PublicTrainingQuestion[] {
  return questions.map(({ id, prompt, choices }) => ({ id, prompt, choices }));
}

export function scoreAttempt(
  questions: TrainingQuestion[],
  answers: Array<{ questionId: string; choiceIndex: number }>,
) {
  if (questions.length === 0) {
    return { score: 0, correct: 0, total: 0 };
  }

  const byId = new Map(answers.map((a) => [a.questionId, a.choiceIndex]));
  let correct = 0;
  for (const question of questions) {
    if (byId.get(question.id) === question.correctIndex) {
      correct += 1;
    }
  }

  const score = Math.round((correct / questions.length) * 100);
  return { score, correct, total: questions.length };
}
