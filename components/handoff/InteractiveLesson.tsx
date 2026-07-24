"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ModuleBody } from "@/components/handoff/ModuleViews";
import type {
  InteractiveBlock,
  InteractiveChapter,
  InteractiveLesson,
} from "@/lib/handoff/interactive";

type Props = {
  lesson: InteractiveLesson;
  slug: string;
  completed: boolean;
  certified: boolean;
  onMarkComplete: () => Promise<void>;
};

export function InteractiveLessonPlayer({
  lesson,
  slug,
  completed,
  certified,
  onMarkComplete,
}: Props) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [scenarioPicks, setScenarioPicks] = useState<Record<string, number>>(
    {},
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapter = lesson.chapters[chapterIndex];
  const isLast = chapterIndex === lesson.chapters.length - 1;
  const progress = ((chapterIndex + 1) / lesson.chapters.length) * 100;

  const chapterReady = useMemo(
    () => isChapterReady(chapter, quizAnswers, scenarioPicks),
    [chapter, quizAnswers, scenarioPicks],
  );

  async function finishModule() {
    setFinishing(true);
    setError(null);
    try {
      await onMarkComplete();
    } catch {
      setError("Could not save progress. Try again.");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="ho-lesson">
      <div className="ho-lesson__progress" aria-hidden>
        <div className="ho-lesson__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="ho-lesson__chapters" role="tablist" aria-label="Lesson chapters">
        {lesson.chapters.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === chapterIndex}
            className={index === chapterIndex ? "is-active" : undefined}
            onClick={() => setChapterIndex(index)}
          >
            <span>{index + 1}</span>
            {item.title}
          </button>
        ))}
      </div>

      <article className="ho-lesson__chapter">
        {chapter.eyebrow ? (
          <p className="ho-lesson__eyebrow">{chapter.eyebrow}</p>
        ) : null}
        <h2>{chapter.title}</h2>

        <div className="ho-lesson__blocks">
          {chapter.blocks.map((block, index) => (
            <BlockView
              key={`${chapter.id}-${index}`}
              block={block}
              blockKey={`${chapter.id}-${index}`}
              quizAnswers={quizAnswers}
              scenarioPicks={scenarioPicks}
              checkedItems={checkedItems}
              onQuizAnswer={(id, choiceIndex) =>
                setQuizAnswers((prev) => ({ ...prev, [id]: choiceIndex }))
              }
              onScenarioPick={(key, choiceIndex) =>
                setScenarioPicks((prev) => ({ ...prev, [key]: choiceIndex }))
              }
              onToggleCheck={(key) =>
                setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            />
          ))}
        </div>
      </article>

      <div className="ho-lesson__nav">
        <button
          type="button"
          className="btn btn--ghost handoff-btn-ghost"
          disabled={chapterIndex === 0}
          onClick={() => setChapterIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </button>

        {!isLast ? (
          <button
            type="button"
            className="btn btn--primary handoff-btn"
            disabled={!chapterReady}
            onClick={() =>
              setChapterIndex((i) => Math.min(lesson.chapters.length - 1, i + 1))
            }
          >
            {chapterReady ? "Next chapter" : "Complete checks to continue"}
          </button>
        ) : (
          <div className="ho-lesson__finish">
            {!completed ? (
              <button
                type="button"
                className="btn btn--primary handoff-btn"
                disabled={!chapterReady || finishing}
                onClick={finishModule}
              >
                {finishing ? "Saving…" : "Complete this leg"}
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
          </div>
        )}
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!chapterReady ? (
        <p className="ho-lesson__hint">
          Answer the knowledge checks in this chapter before moving on.
        </p>
      ) : null}
    </div>
  );
}

function isChapterReady(
  chapter: InteractiveChapter,
  quizAnswers: Record<string, number>,
  scenarioPicks: Record<string, number>,
) {
  for (const [index, block] of chapter.blocks.entries()) {
    if (block.type === "quiz") {
      if (quizAnswers[block.id] !== block.correctIndex) return false;
    }
    if (block.type === "scenario") {
      const key = `${chapter.id}-${index}`;
      const pick = scenarioPicks[key];
      if (pick === undefined) return false;
      if (!block.choices[pick]?.correct) return false;
    }
  }
  return true;
}

function BlockView({
  block,
  blockKey,
  quizAnswers,
  scenarioPicks,
  checkedItems,
  onQuizAnswer,
  onScenarioPick,
  onToggleCheck,
}: {
  block: InteractiveBlock;
  blockKey: string;
  quizAnswers: Record<string, number>;
  scenarioPicks: Record<string, number>;
  checkedItems: Record<string, boolean>;
  onQuizAnswer: (id: string, choiceIndex: number) => void;
  onScenarioPick: (key: string, choiceIndex: number) => void;
  onToggleCheck: (key: string) => void;
}) {
  if (block.type === "text") {
    return <ModuleBody body={block.markdown} />;
  }

  if (block.type === "video") {
    return (
      <figure className="ho-video">
        <div className="ho-video__frame">
          <iframe
            src={`https://www.youtube.com/embed/${block.youtubeId}`}
            title={block.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <figcaption>
          <strong>{block.title}</strong>
          {block.caption ? <span>{block.caption}</span> : null}
          {block.sourceUrl ? (
            <a href={block.sourceUrl} target="_blank" rel="noreferrer">
              {block.sourceLabel ?? "Open on XGRIDS / YouTube"}
            </a>
          ) : null}
        </figcaption>
      </figure>
    );
  }

  if (block.type === "resource") {
    return (
      <a
        className="ho-resource"
        href={block.url}
        target="_blank"
        rel="noreferrer"
      >
        <span className="ho-resource__label">Resource</span>
        <strong>{block.title}</strong>
        {block.description ? <span>{block.description}</span> : null}
      </a>
    );
  }

  if (block.type === "callout") {
    return (
      <aside className={`ho-callout ho-callout--${block.tone}`}>
        <strong>{block.title}</strong>
        <p>{block.body}</p>
      </aside>
    );
  }

  if (block.type === "checklist") {
    return (
      <div className="ho-checklist">
        <h3>{block.title}</h3>
        <ul>
          {block.items.map((item, index) => {
            const key = `${blockKey}-check-${index}`;
            return (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(checkedItems[key])}
                    onChange={() => onToggleCheck(key)}
                  />
                  <span>{item}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (block.type === "scenario") {
    const pick = scenarioPicks[blockKey];
    return (
      <div className="ho-scenario">
        <h3>{block.title}</h3>
        <p className="ho-scenario__situation">{block.situation}</p>
        <div className="ho-scenario__choices">
          {block.choices.map((choice, index) => {
            const selected = pick === index;
            const revealed = pick !== undefined;
            return (
              <button
                key={index}
                type="button"
                className={[
                  selected ? "is-selected" : "",
                  revealed && choice.correct ? "is-correct" : "",
                  revealed && selected && !choice.correct ? "is-wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onScenarioPick(blockKey, index)}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
        {pick !== undefined ? (
          <p className="ho-scenario__feedback">{block.choices[pick]?.feedback}</p>
        ) : null}
      </div>
    );
  }

  if (block.type === "quiz") {
    const answer = quizAnswers[block.id];
    const answered = answer !== undefined;
    return (
      <div className="ho-inline-quiz">
        <h3>Knowledge check</h3>
        <p>{block.prompt}</p>
        <div className="ho-scenario__choices">
          {block.choices.map((choice, index) => {
            const selected = answer === index;
            return (
              <button
                key={index}
                type="button"
                className={[
                  selected ? "is-selected" : "",
                  answered && index === block.correctIndex ? "is-correct" : "",
                  answered && selected && index !== block.correctIndex
                    ? "is-wrong"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onQuizAnswer(block.id, index)}
              >
                {choice}
              </button>
            );
          })}
        </div>
        {answered ? (
          <p className="ho-scenario__feedback">{block.explanation}</p>
        ) : null}
      </div>
    );
  }

  return null;
}
