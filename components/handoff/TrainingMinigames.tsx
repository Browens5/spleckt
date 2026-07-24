"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { MinigameBlock } from "@/lib/handoff/interactive";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Burst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="ho-burst" aria-hidden>
      {Array.from({ length: 10 }).map((_, index) => (
        <span key={index} style={{ ["--i" as string]: index }} />
      ))}
    </div>
  );
}

export function TrainingMinigame({
  block,
  completed,
  onComplete,
}: {
  block: MinigameBlock;
  completed: boolean;
  onComplete: () => void;
}) {
  return (
    <section className="ho-game">
      <div className="ho-game__header">
        <span className="ho-game__badge">Mini game</span>
        <h3>{block.title}</h3>
        <p>{block.prompt}</p>
      </div>
      {block.kind === "order" ? (
        <OrderGame block={block} completed={completed} onComplete={onComplete} />
      ) : null}
      {block.kind === "match" ? (
        <MatchGame block={block} completed={completed} onComplete={onComplete} />
      ) : null}
      {block.kind === "baton" ? (
        <BatonGame block={block} completed={completed} onComplete={onComplete} />
      ) : null}
      {block.kind === "rapid" ? (
        <RapidGame block={block} completed={completed} onComplete={onComplete} />
      ) : null}
    </section>
  );
}

function OrderGame({
  block,
  completed,
  onComplete,
}: {
  block: Extract<MinigameBlock, { kind: "order" }>;
  completed: boolean;
  onComplete: () => void;
}) {
  const [pool, setPool] = useState(() =>
    shuffle(block.items.map((label, index) => ({ label, index }))),
  );
  const [picked, setPicked] = useState<number[]>([]);
  const [status, setStatus] = useState<"idle" | "wrong" | "won">(
    completed ? "won" : "idle",
  );

  function choose(index: number) {
    if (status === "won" || picked.includes(index)) return;
    const next = [...picked, index];
    setPicked(next);
    if (next.length < block.correctOrder.length) return;
    const ok = next.every((value, i) => value === block.correctOrder[i]);
    if (ok) {
      setStatus("won");
      onComplete();
    } else {
      setStatus("wrong");
      window.setTimeout(() => {
        setPicked([]);
        setStatus("idle");
        setPool(shuffle(block.items.map((label, itemIndex) => ({ label, index: itemIndex }))));
      }, 700);
    }
  }

  return (
    <div className={`ho-game__board${status === "won" ? " is-won" : ""}`}>
      <Burst show={status === "won"} />
      <div className="ho-game__lane">
        {picked.map((index) => (
          <motion.span
            key={`picked-${index}`}
            layout
            className="ho-game__chip is-locked"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {block.items[index]}
          </motion.span>
        ))}
        {picked.length === 0 ? (
          <span className="ho-game__placeholder">Tap steps in order…</span>
        ) : null}
      </div>
      <div className="ho-game__choices">
        {pool.map((item) => (
          <button
            key={item.index}
            type="button"
            className={picked.includes(item.index) ? "is-used" : undefined}
            disabled={picked.includes(item.index) || status === "won"}
            onClick={() => choose(item.index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {status === "wrong" ? <p className="ho-game__msg is-wrong">Not quite — try again.</p> : null}
      {status === "won" ? <p className="ho-game__msg is-won">{block.success}</p> : null}
    </div>
  );
}

function MatchGame({
  block,
  completed,
  onComplete,
}: {
  block: Extract<MinigameBlock, { kind: "match" }>;
  completed: boolean;
  onComplete: () => void;
}) {
  const terms = useMemo(() => block.pairs.map((pair, index) => ({ ...pair, index })), [block.pairs]);
  const [defs] = useState(() => shuffle(terms));
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>(completed ? terms.map((t) => t.index) : []);
  const [flashWrong, setFlashWrong] = useState<number | null>(null);

  function pickTerm(index: number) {
    if (matched.includes(index)) return;
    setSelectedTerm(index);
  }

  function pickDef(index: number) {
    if (matched.includes(index) || selectedTerm === null) return;
    if (selectedTerm === index) {
      const next = [...matched, index];
      setMatched(next);
      setSelectedTerm(null);
      if (next.length === terms.length) onComplete();
    } else {
      setFlashWrong(index);
      window.setTimeout(() => {
        setFlashWrong(null);
        setSelectedTerm(null);
      }, 450);
    }
  }

  const won = matched.length === terms.length;

  return (
    <div className={`ho-game__board${won ? " is-won" : ""}`}>
      <Burst show={won} />
      <div className="ho-match">
        <div className="ho-match__col">
          {terms.map((term) => (
            <button
              key={`term-${term.index}`}
              type="button"
              className={[
                matched.includes(term.index) ? "is-matched" : "",
                selectedTerm === term.index ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={matched.includes(term.index) || won}
              onClick={() => pickTerm(term.index)}
            >
              {term.term}
            </button>
          ))}
        </div>
        <div className="ho-match__col">
          {defs.map((def) => (
            <button
              key={`def-${def.index}`}
              type="button"
              className={[
                matched.includes(def.index) ? "is-matched" : "",
                flashWrong === def.index ? "is-wrong" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={matched.includes(def.index) || won}
              onClick={() => pickDef(def.index)}
            >
              {def.definition}
            </button>
          ))}
        </div>
      </div>
      {won ? <p className="ho-game__msg is-won">{block.success}</p> : null}
    </div>
  );
}

function BatonGame({
  block,
  completed,
  onComplete,
}: {
  block: Extract<MinigameBlock, { kind: "baton" }>;
  completed: boolean;
  onComplete: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<"idle" | "miss" | "catch">(
    completed ? "catch" : "idle",
  );

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = ((now - start) % 2200) / 2200;
      setPos(t);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  function start() {
    setResult("idle");
    setRunning(true);
  }

  function catchBaton() {
    if (!running) return;
    // Exchange zone roughly 58%–78% of the lane
    if (pos >= 0.58 && pos <= 0.78) {
      setRunning(false);
      setResult("catch");
      onComplete();
    } else {
      setResult("miss");
      setRunning(false);
    }
  }

  return (
    <div className={`ho-game__board${result === "catch" ? " is-won" : ""}`}>
      <Burst show={result === "catch"} />
      <div className="ho-baton-track">
        <div className="ho-baton-track__zone" aria-hidden />
        <motion.div
          className="ho-baton-track__baton"
          style={{ left: `${pos * 100}%` }}
          animate={running ? { rotate: [-12, 12, -12] } : { rotate: -12 }}
          transition={running ? { repeat: Infinity, duration: 0.35 } : undefined}
        />
      </div>
      <div className="ho-game__actions">
        {result !== "catch" ? (
          <button type="button" className="btn btn--ghost handoff-btn-ghost" onClick={start}>
            {running ? "Marker moving…" : "Start"}
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--primary handoff-btn"
          disabled={!running && result !== "catch"}
          onClick={catchBaton}
        >
          Capture now
        </button>
      </div>
      {result === "miss" ? (
        <p className="ho-game__msg is-wrong">Outside the window — reset and try again.</p>
      ) : null}
      {result === "catch" ? <p className="ho-game__msg is-won">{block.success}</p> : null}
    </div>
  );
}

function RapidGame({
  block,
  completed,
  onComplete,
}: {
  block: Extract<MinigameBlock, { kind: "rapid" }>;
  completed: boolean;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(completed ? block.rounds.length : 0);
  const [done, setDone] = useState(completed);
  const [feedback, setFeedback] = useState<string | null>(
    completed ? block.success : null,
  );

  function answer(value: boolean) {
    if (done) return;
    const round = block.rounds[index];
    const correct = round.correct === value;
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);
    setFeedback(correct ? "Correct." : round.explanation);
    const nextIndex = index + 1;
    if (nextIndex >= block.rounds.length) {
      setDone(true);
      if (nextScore >= block.passScore) {
        setFeedback(block.success);
        onComplete();
      } else {
        setFeedback(`Score ${nextScore}/${block.rounds.length}. Need ${block.passScore} — tap Retry.`);
      }
      return;
    }
    window.setTimeout(() => {
      setIndex(nextIndex);
      setFeedback(null);
    }, 650);
  }

  function retry() {
    setIndex(0);
    setScore(0);
    setDone(false);
    setFeedback(null);
  }

  const round = block.rounds[Math.min(index, block.rounds.length - 1)];

  return (
    <div className={`ho-game__board${done && score >= block.passScore ? " is-won" : ""}`}>
      <Burst show={done && score >= block.passScore} />
      <div className="ho-rapid__meta">
        <span>
          Round {Math.min(index + 1, block.rounds.length)}/{block.rounds.length}
        </span>
        <span>Score {score}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={done ? "done" : index}
          className="ho-rapid__statement"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          {done ? feedback : round.statement}
        </motion.p>
      </AnimatePresence>
      {!done ? (
        <div className="ho-game__actions">
          <button type="button" className="btn btn--primary handoff-btn" onClick={() => answer(true)}>
            True
          </button>
          <button
            type="button"
            className="btn btn--ghost handoff-btn-ghost"
            onClick={() => answer(false)}
          >
            False
          </button>
        </div>
      ) : score < block.passScore ? (
        <button type="button" className="btn btn--primary handoff-btn" onClick={retry}>
          Retry speed round
        </button>
      ) : (
        <p className="ho-game__msg is-won">{block.success}</p>
      )}
      {!done && feedback ? <p className="ho-game__msg">{feedback}</p> : null}
    </div>
  );
}
