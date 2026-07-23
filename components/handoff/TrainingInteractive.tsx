"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicTrainingQuestion } from "@/lib/handoff/types";

export function ModuleActions({
  slug,
  completed,
  certified,
}: {
  slug: string;
  completed: boolean;
  certified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markComplete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/handoff/modules/${slug}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Unable to update progress");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to update progress");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="handoff-actions">
      {!completed ? (
        <button
          type="button"
          className="btn btn--primary handoff-btn"
          onClick={markComplete}
          disabled={loading}
        >
          {loading ? "Saving…" : "Mark module complete"}
        </button>
      ) : null}
      <Link
        href={`/center/modules/${slug}/test`}
        className={
          completed || certified
            ? "btn btn--primary handoff-btn"
            : "btn btn--ghost handoff-btn-ghost"
        }
      >
        {certified ? "Retake certification test" : "Take certification test"}
      </Link>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

export function CertificationTest({
  testId,
  title,
  passingScore,
  questions,
  moduleSlug,
}: {
  testId: string;
  title: string;
  passingScore: number;
  questions: PublicTrainingQuestion[];
  moduleSlug: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    passingScore: number;
    certification: { code: string } | null;
  } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (questions.some((q) => answers[q.id] === undefined)) {
      setError("Answer every question before submitting.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/handoff/tests/${testId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((q) => ({
            questionId: q.id,
            choiceIndex: answers[q.id],
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to submit test");
        return;
      }
      setResult(data);
      router.refresh();
    } catch {
      setError("Unable to submit test");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="handoff-test-result">
        <h2>{result.passed ? "Certification earned" : "Keep going"}</h2>
        <p>
          You scored <strong>{result.score}%</strong>. Passing is{" "}
          {result.passingScore}%.
        </p>
        {result.certification ? (
          <p className="handoff-cert-code">
            Certificate code: <code>{result.certification.code}</code>
          </p>
        ) : null}
        <div className="handoff-actions">
          <Link href={`/center/modules/${moduleSlug}`} className="btn btn--ghost handoff-btn-ghost">
            Back to module
          </Link>
          {result.passed ? (
            <Link href="/center/certifications" className="btn btn--primary handoff-btn">
              View certifications
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn--primary handoff-btn"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="handoff-test" onSubmit={onSubmit}>
      <header>
        <h1>{title}</h1>
        <p>Passing score: {passingScore}%</p>
      </header>

      {questions.map((question, index) => (
        <fieldset key={question.id} className="handoff-question">
          <legend>
            {index + 1}. {question.prompt}
          </legend>
          {question.choices.map((choice, choiceIndex) => (
            <label key={choiceIndex}>
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === choiceIndex}
                onChange={() =>
                  setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }))
                }
              />
              <span>{choice}</span>
            </label>
          ))}
        </fieldset>
      ))}

      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn--primary handoff-btn" type="submit" disabled={loading}>
        {loading ? "Scoring…" : "Submit test"}
      </button>
    </form>
  );
}
