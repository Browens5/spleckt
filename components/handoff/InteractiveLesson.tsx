"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ModuleBody } from "@/components/handoff/ModuleViews";
import { TrainingMinigame } from "@/components/handoff/TrainingMinigames";
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
  const [minigames, setMinigames] = useState<Record<string, boolean>>({});
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapter = lesson.chapters[chapterIndex];
  const isLast = chapterIndex === lesson.chapters.length - 1;
  const progress = ((chapterIndex + 1) / lesson.chapters.length) * 100;

  const chapterReady = useMemo(
    () => isChapterReady(chapter, quizAnswers, scenarioPicks, minigames),
    [chapter, quizAnswers, scenarioPicks, minigames],
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
        <motion.div
          className="ho-lesson__progress-bar"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
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

      <AnimatePresence mode="wait">
        <motion.article
          key={chapter.id}
          className="ho-lesson__chapter"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
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
                minigames={minigames}
                onQuizAnswer={(id, choiceIndex) =>
                  setQuizAnswers((prev) => ({ ...prev, [id]: choiceIndex }))
                }
                onScenarioPick={(key, choiceIndex) =>
                  setScenarioPicks((prev) => ({ ...prev, [key]: choiceIndex }))
                }
                onToggleCheck={(key) =>
                  setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                onMinigameComplete={(id) =>
                  setMinigames((prev) => ({ ...prev, [id]: true }))
                }
              />
            ))}
          </div>
        </motion.article>
      </AnimatePresence>

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
          <motion.button
            type="button"
            className="btn btn--primary handoff-btn"
            disabled={!chapterReady}
            whileTap={chapterReady ? { scale: 0.98 } : undefined}
            onClick={() =>
              setChapterIndex((i) => Math.min(lesson.chapters.length - 1, i + 1))
            }
          >
            {chapterReady ? "Next leg →" : "Finish checks & games first"}
          </motion.button>
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
          Clear the knowledge checks and mini games in this chapter to keep the baton moving.
        </p>
      ) : null}
    </div>
  );
}

function isChapterReady(
  chapter: InteractiveChapter,
  quizAnswers: Record<string, number>,
  scenarioPicks: Record<string, number>,
  minigames: Record<string, boolean>,
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
    if (block.type === "minigame") {
      if (!minigames[block.id]) return false;
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
  minigames,
  onQuizAnswer,
  onScenarioPick,
  onToggleCheck,
  onMinigameComplete,
}: {
  block: InteractiveBlock;
  blockKey: string;
  quizAnswers: Record<string, number>;
  scenarioPicks: Record<string, number>;
  checkedItems: Record<string, boolean>;
  minigames: Record<string, boolean>;
  onQuizAnswer: (id: string, choiceIndex: number) => void;
  onScenarioPick: (key: string, choiceIndex: number) => void;
  onToggleCheck: (key: string) => void;
  onMinigameComplete: (id: string) => void;
}) {
  if (block.type === "text") {
    return <ModuleBody body={block.markdown} />;
  }

  if (block.type === "video") {
    return (
      <motion.figure
        className="ho-video"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
      >
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
      </motion.figure>
    );
  }

  if (block.type === "resource") {
    return (
      <motion.a
        className="ho-resource"
        href={block.url}
        target="_blank"
        rel="noreferrer"
        whileHover={{ y: -2 }}
      >
        <span className="ho-resource__label">Resource</span>
        <strong>{block.title}</strong>
        {block.description ? <span>{block.description}</span> : null}
      </motion.a>
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
              <motion.button
                key={index}
                type="button"
                whileTap={{ scale: 0.985 }}
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
              </motion.button>
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
              <motion.button
                key={index}
                type="button"
                whileTap={{ scale: 0.985 }}
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
              </motion.button>
            );
          })}
        </div>
        {answered ? (
          <p className="ho-scenario__feedback">{block.explanation}</p>
        ) : null}
      </div>
    );
  }

  if (block.type === "minigame") {
    return (
      <TrainingMinigame
        block={block}
        completed={Boolean(minigames[block.id])}
        onComplete={() => onMinigameComplete(block.id)}
      />
    );
  }

  return null;
}
