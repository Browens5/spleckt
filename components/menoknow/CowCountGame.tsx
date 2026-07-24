"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CowSprite } from "@/components/menoknow/CowSprite";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";
import {
  buildChoices,
  celebratePhrase,
  COUNT_LEVELS,
  getLevel,
  layoutForCount,
  pickTarget,
  speakText,
  type CountLevelId,
  type CountMode,
} from "@/lib/menoknow/cow-count";

type Phase = "menu" | "play" | "level-done";

type RoundState = {
  target: number;
  choices: number[];
  /** For individual herds: each cow tapped. */
  countedCows: boolean[];
  /** For grouped herds: each ten-pen tapped. */
  countedPens: boolean[];
  /** For grouped herds: leftover ones tapped. */
  countedOnes: boolean[];
  built: number;
  guided: boolean;
  answered: boolean;
  correct: boolean | null;
};

function freshRound(levelId: CountLevelId, avoid?: number): RoundState {
  const level = getLevel(levelId);
  const target = pickTarget(level, avoid);
  const layout = layoutForCount(target);
  return {
    target,
    choices: buildChoices(target, level),
    countedCows: Array.from({ length: target }, () => false),
    countedPens: Array.from({ length: layout.tens }, () => false),
    countedOnes: Array.from({ length: layout.ones }, () => false),
    built: 0,
    guided: false,
    answered: false,
    correct: null,
  };
}

function tallyCount(round: RoundState) {
  const layout = layoutForCount(round.target);
  if (layout.showIndividuals) {
    return round.countedCows.filter(Boolean).length;
  }
  const tens = round.countedPens.filter(Boolean).length * 10;
  const ones = round.countedOnes.filter(Boolean).length;
  return tens + ones;
}

function fullyCounted(round: RoundState) {
  if (round.target === 0) return true;
  if (round.guided) return true;
  return tallyCount(round) >= round.target;
}

export function CowCountGame() {
  const liveId = useId();
  const [phase, setPhase] = useState<Phase>("menu");
  const [levelId, setLevelId] = useState<CountLevelId>("starter");
  const [mode, setMode] = useState<CountMode>("count");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState<RoundState | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const level = getLevel(levelId);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (guideTimer.current) clearTimeout(guideTimer.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function clearTimers() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (guideTimer.current) clearTimeout(guideTimer.current);
  }

  function startGame(nextLevel: CountLevelId, nextMode: CountMode) {
    clearTimers();
    setLevelId(nextLevel);
    setMode(nextMode);
    setRoundIndex(0);
    setScore(0);
    const first = freshRound(nextLevel);
    setRound(first);
    setPhase("play");
    speakText(
      nextMode === "count"
        ? "Tap each cow as you count. Then pick how many."
        : `Build a herd of ${first.target} cows.`,
    );
  }

  function promptRound(next: RoundState, nextMode: CountMode) {
    if (nextMode === "count") {
      if (next.target === 0) speakText("An empty pasture. How many cows?");
      else speakText("Count the cows. Tap as you go.");
    } else {
      speakText(`We need ${next.target} cows. Tap plus to add.`);
    }
  }

  function goNextRound(currentTarget: number, nextScore: number) {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= level.rounds) {
      setPhase("level-done");
      speakText(`Level complete! You earned ${nextScore} stars.`);
      return;
    }
    const next = freshRound(levelId, currentTarget);
    setRoundIndex(nextIndex);
    setRound(next);
    promptRound(next, mode);
  }

  function onTapCow(index: number) {
    if (!round || round.answered || mode !== "count") return;
    if (round.countedCows[index]) return;
    const countedCows = [...round.countedCows];
    countedCows[index] = true;
    const next = { ...round, countedCows };
    setRound(next);
    speakText(String(tallyCount(next)));
  }

  function onTapPen(index: number) {
    if (!round || round.answered || mode !== "count") return;
    if (round.countedPens[index]) return;
    const countedPens = [...round.countedPens];
    countedPens[index] = true;
    const next = { ...round, countedPens };
    setRound(next);
    speakText(String(tallyCount(next)));
  }

  function onTapOne(index: number) {
    if (!round || round.answered || mode !== "count") return;
    if (round.countedOnes[index]) return;
    const countedOnes = [...round.countedOnes];
    countedOnes[index] = true;
    const next = { ...round, countedOnes };
    setRound(next);
    speakText(String(tallyCount(next)));
  }

  function countWithMe() {
    if (!round || mode !== "count" || round.answered) return;
    if (round.target === 0) {
      speakText("Zero cows");
      setRound({ ...round, guided: true });
      return;
    }

    clearTimers();
    const layout = layoutForCount(round.target);
    const steps: number[] = [];

    if (layout.showIndividuals) {
      for (let n = 1; n <= round.target; n += 1) steps.push(n);
    } else {
      for (let t = 1; t <= layout.tens; t += 1) steps.push(t * 10);
      for (let o = 1; o <= layout.ones; o += 1) {
        steps.push(layout.tens * 10 + o);
      }
    }

    let i = 0;
    const tick = () => {
      const value = steps[i];
      if (value == null) {
        setRound((current) =>
          current
            ? {
                ...current,
                guided: true,
                countedCows: current.countedCows.map(() => true),
                countedPens: current.countedPens.map(() => true),
                countedOnes: current.countedOnes.map(() => true),
              }
            : current,
        );
        return;
      }
      speakText(String(value));
      setRound((current) => {
        if (!current) return current;
        if (layout.showIndividuals) {
          return {
            ...current,
            countedCows: current.countedCows.map((_, idx) => idx < value),
          };
        }
        const pensDone = Math.min(layout.tens, Math.floor(value / 10));
        const onesDone =
          value >= layout.tens * 10 ? value - layout.tens * 10 : 0;
        return {
          ...current,
          countedPens: current.countedPens.map((_, idx) => idx < pensDone),
          countedOnes: current.countedOnes.map((_, idx) => idx < onesDone),
        };
      });
      i += 1;
      guideTimer.current = setTimeout(tick, 700);
    };
    tick();
  }

  function addCow(amount = 1) {
    if (!round || mode !== "build" || round.answered) return;
    const cap = Math.max(level.max, round.target + 5);
    const built = Math.min(cap, round.built + amount);
    if (built === round.built) return;
    setRound({ ...round, built });
    speakText(String(built));
  }

  function removeCow() {
    if (!round || mode !== "build" || round.answered) return;
    if (round.built <= 0) return;
    const built = round.built - 1;
    setRound({ ...round, built });
    speakText(built === 0 ? "Zero" : String(built));
  }

  function submitAnswer(value: number) {
    if (!round || round.answered) return;

    if (mode === "count" && round.target > 0 && !fullyCounted(round)) {
      speakText("Count first — tap cows or pens, or press Count with me.");
      return;
    }

    const guess = mode === "build" ? round.built : value;
    const ok = guess === round.target;
    setRound({ ...round, answered: true, correct: ok });

    if (ok) {
      const nextScore = score + 1;
      setScore(nextScore);
      speakText(celebratePhrase(round.target));
      advanceTimer.current = setTimeout(() => {
        goNextRound(round.target, nextScore);
      }, 1600);
    } else {
      speakText(
        mode === "build"
          ? `Not yet. We need ${round.target}. You have ${round.built}.`
          : `Not yet. There are ${round.target} cows.`,
      );
    }
  }

  function retryRound() {
    if (!round) return;
    const reset = freshRound(levelId, round.target + 1);
    // Keep same target for retry.
    const layout = layoutForCount(round.target);
    const next: RoundState = {
      ...reset,
      target: round.target,
      choices: round.choices,
      countedCows: Array.from({ length: round.target }, () => false),
      countedPens: Array.from({ length: layout.tens }, () => false),
      countedOnes: Array.from({ length: layout.ones }, () => false),
    };
    setRound(next);
    promptRound(next, mode);
  }

  return (
    <div className="mk-shell mk-cowgame">
      <header className="mk-header">
        <div className="mk-header__inner">
          <MenoknowBrand />
          <nav className="mk-nav" aria-label="Primary">
            <Link href="/play/farm">Cow Farm</Link>
            <Link href="/" className="mk-btn mk-btn--ghost">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mk-cowgame__main">
        <p className="mk-coming__eyebrow">Cow Farm · Numbers</p>
        <h1>Count the cows</h1>
        <p className="mk-cowgame__lede">
          Tap each cow (or each pen of ten), say the number, then choose how
          many. Zero means an empty pasture.
        </p>

        <div className="mk-cowgame__live" id={liveId} aria-live="polite">
          {phase === "play" && round
            ? mode === "count"
              ? round.target === 0
                ? "Empty pasture. How many cows?"
                : `Counting… ${tallyCount(round)} so far.`
              : `Build ${round.target} cows. You have ${round.built}.`
            : null}
        </div>

        <AnimatePresence mode="wait">
          {phase === "menu" ? (
            <motion.section
              key="menu"
              className="mk-cowgame__menu"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2>How do you want to play?</h2>
              <div className="mk-cowgame__modes" role="group" aria-label="Game mode">
                <button
                  type="button"
                  className={`mk-mode${mode === "count" ? " is-active" : ""}`}
                  onClick={() => setMode("count")}
                >
                  <strong>Count the herd</strong>
                  <span>See cows → count → pick the number</span>
                </button>
                <button
                  type="button"
                  className={`mk-mode${mode === "build" ? " is-active" : ""}`}
                  onClick={() => setMode("build")}
                >
                  <strong>Make a herd</strong>
                  <span>Hear a number → add cows until it matches</span>
                </button>
              </div>

              <h2>Pick a level</h2>
              <div className="mk-cowgame__levels">
                {COUNT_LEVELS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="mk-level"
                    onClick={() => startGame(item.id, mode)}
                  >
                    <span className="mk-level__range">
                      {item.decadesOnly ? "Tens" : `${item.min}–${item.max}`}
                    </span>
                    <strong>{item.title}</strong>
                    <span>{item.blurb}</span>
                  </button>
                ))}
              </div>
            </motion.section>
          ) : null}

          {phase === "play" && round ? (
            <motion.section
              key={`play-${roundIndex}-${round.target}`}
              className="mk-cowgame__play"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mk-cowgame__status">
                <span>
                  Round {roundIndex + 1} / {level.rounds}
                </span>
                <span>{level.title}</span>
                <span>Stars {score}</span>
              </div>

              <div className="mk-cowgame__prompt">
                {mode === "count" ? (
                  <p>
                    {round.target === 0
                      ? "How many cows are in the pasture?"
                      : "Tap each cow or pen as you count. Then pick the total."}
                  </p>
                ) : (
                  <p>
                    Build a herd of <strong>{round.target}</strong> cows.
                  </p>
                )}
              </div>

              <Pasture
                mode={mode}
                target={round.target}
                countedCows={round.countedCows}
                countedPens={round.countedPens}
                countedOnes={round.countedOnes}
                built={round.built}
                locked={round.answered}
                onTapCow={onTapCow}
                onTapPen={onTapPen}
                onTapOne={onTapOne}
              />

              {mode === "count" ? (
                <div className="mk-cowgame__helpers">
                  <button
                    type="button"
                    className="mk-btn mk-btn--ghost"
                    onClick={countWithMe}
                    disabled={round.answered}
                  >
                    Count with me
                  </button>
                  <span className="mk-cowgame__tally" aria-hidden>
                    {tallyCount(round)}
                    {round.target > 0 ? ` counted` : ""}
                  </span>
                </div>
              ) : (
                <div className="mk-cowgame__builders">
                  <button
                    type="button"
                    className="mk-btn mk-btn--ghost mk-btn--lg"
                    onClick={removeCow}
                    disabled={round.answered || round.built === 0}
                    aria-label="Remove one cow"
                  >
                    −
                  </button>
                  <span className="mk-cowgame__built">{round.built}</span>
                  <button
                    type="button"
                    className="mk-btn mk-btn--primary mk-btn--lg"
                    onClick={() => addCow(1)}
                    disabled={round.answered}
                    aria-label="Add one cow"
                  >
                    +1
                  </button>
                  {level.max > 20 ? (
                    <button
                      type="button"
                      className="mk-btn mk-btn--primary mk-btn--lg"
                      onClick={() => addCow(10)}
                      disabled={round.answered}
                      aria-label="Add ten cows"
                    >
                      +10
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="mk-btn mk-btn--primary mk-btn--lg"
                    onClick={() => submitAnswer(round.built)}
                    disabled={round.answered}
                  >
                    Done
                  </button>
                </div>
              )}

              {mode === "count" ? (
                <div
                  className="mk-cowgame__choices"
                  role="group"
                  aria-label="How many cows?"
                >
                  {round.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`mk-choice${
                        round.answered && choice === round.target
                          ? " is-correct"
                          : ""
                      }${
                        round.answered &&
                        round.correct === false &&
                        choice !== round.target
                          ? " is-dim"
                          : ""
                      }`}
                      onClick={() => submitAnswer(choice)}
                      disabled={round.answered}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              ) : null}

              {round.answered ? (
                <div
                  className={`mk-cowgame__feedback${
                    round.correct ? " is-good" : " is-retry"
                  }`}
                >
                  {round.correct ? (
                    <p>{celebratePhrase(round.target)}</p>
                  ) : (
                    <>
                      <p>
                        Nice try. The herd has <strong>{round.target}</strong>.
                      </p>
                      <button
                        type="button"
                        className="mk-btn mk-btn--primary"
                        onClick={retryRound}
                      >
                        Try again
                      </button>
                    </>
                  )}
                </div>
              ) : null}

              <div className="mk-cowgame__toolbar">
                <button
                  type="button"
                  className="mk-btn mk-btn--ghost"
                  onClick={() => {
                    clearTimers();
                    setPhase("menu");
                    setRound(null);
                  }}
                >
                  Change level
                </button>
              </div>
            </motion.section>
          ) : null}

          {phase === "level-done" ? (
            <motion.section
              key="done"
              className="mk-cowgame__done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2>Herd hero!</h2>
              <p>
                You finished <strong>{level.title}</strong> with {score} star
                {score === 1 ? "" : "s"}.
              </p>
              <div className="mk-cowgame__done-actions">
                <button
                  type="button"
                  className="mk-btn mk-btn--primary mk-btn--lg"
                  onClick={() => startGame(levelId, mode)}
                >
                  Play again
                </button>
                <button
                  type="button"
                  className="mk-btn mk-btn--ghost mk-btn--lg"
                  onClick={() => setPhase("menu")}
                >
                  Pick another level
                </button>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Pasture({
  mode,
  target,
  countedCows,
  countedPens,
  countedOnes,
  built,
  locked,
  onTapCow,
  onTapPen,
  onTapOne,
}: {
  mode: CountMode;
  target: number;
  countedCows: boolean[];
  countedPens: boolean[];
  countedOnes: boolean[];
  built: number;
  locked: boolean;
  onTapCow: (index: number) => void;
  onTapPen: (index: number) => void;
  onTapOne: (index: number) => void;
}) {
  const displayCount = mode === "count" ? target : built;
  const layout = layoutForCount(displayCount);

  if (displayCount === 0) {
    return (
      <div className="mk-pasture mk-pasture--empty" aria-label="Empty pasture">
        <p>No cows yet — this is zero.</p>
      </div>
    );
  }

  if (layout.showIndividuals) {
    return (
      <div
        className="mk-pasture"
        aria-label={`${displayCount} cow${displayCount === 1 ? "" : "s"}`}
      >
        {Array.from({ length: displayCount }).map((_, index) => (
          <CowSprite
            key={index}
            size={displayCount > 10 ? "sm" : "md"}
            counted={mode === "count" ? countedCows[index] : false}
            onClick={
              mode === "count" && !locked ? () => onTapCow(index) : undefined
            }
            label={
              mode === "count"
                ? countedCows[index]
                  ? `Cow ${index + 1}, already counted`
                  : "Cow, tap to count"
                : `Cow ${index + 1}`
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="mk-pasture mk-pasture--grouped"
      aria-label={`${displayCount} cows in pens of ten`}
    >
      {Array.from({ length: layout.tens }).map((_, index) => (
        <button
          key={`ten-${index}`}
          type="button"
          className={`mk-pen${countedPens[index] ? " is-counted" : ""}${
            mode === "count" && !locked ? " mk-pen--tap" : ""
          }`}
          onClick={
            mode === "count" && !locked ? () => onTapPen(index) : undefined
          }
          disabled={mode !== "count" || locked}
          aria-label={
            countedPens[index]
              ? `Pen of 10, counted`
              : "Pen of 10 cows, tap to count"
          }
        >
          <span className="mk-pen__label">10</span>
          <span className="mk-pen__cows" aria-hidden>
            {Array.from({ length: 10 }).map((__, cowIndex) => (
              <CowSprite key={cowIndex} size="sm" />
            ))}
          </span>
        </button>
      ))}
      {layout.ones > 0 ? (
        <div className="mk-pen mk-pen--ones">
          <span className="mk-pen__label">{layout.ones}</span>
          <span className="mk-pen__cows">
            {Array.from({ length: layout.ones }).map((_, index) => (
              <CowSprite
                key={index}
                size="sm"
                counted={mode === "count" ? countedOnes[index] : false}
                onClick={
                  mode === "count" && !locked
                    ? () => onTapOne(index)
                    : undefined
                }
                label="Cow"
              />
            ))}
          </span>
        </div>
      ) : null}
      {mode === "count" && !locked ? (
        <p className="mk-pasture__hint">
          Count pens by tens (10, 20, 30…), then the leftover cows.
        </p>
      ) : null}
    </div>
  );
}
