"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CowSprite } from "@/components/menoknow/CowSprite";
import { FarmerDot, StoryStage } from "@/components/menoknow/CowStory";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";
import { getFarmAudio } from "@/lib/menoknow/audio";
import {
  buildChoices,
  COUNT_LEVELS,
  getLevel,
  layoutForCount,
  pickTarget,
  speakNumber,
  speakText,
  numberWord,
  type CountLevelId,
  type CountMode,
} from "@/lib/menoknow/cow-count";
import {
  finishStory,
  levelStory,
  modeStory,
  STORY_INTRO,
  successStory,
} from "@/lib/menoknow/cow-story";

type Phase = "story" | "menu" | "level-intro" | "play" | "level-done";

type RoundState = {
  target: number;
  choices: number[];
  countedCows: boolean[];
  countedPens: boolean[];
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
  const audio = getFarmAudio();
  const [phase, setPhase] = useState<Phase>("story");
  const [storyStep, setStoryStep] = useState(0);
  const [levelId, setLevelId] = useState<CountLevelId>("starter");
  const [mode, setMode] = useState<CountMode>("count");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState<RoundState | null>(null);
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const level = getLevel(levelId);
  const introBeat = STORY_INTRO[storyStep] ?? STORY_INTRO[0]!;
  const levelBeat = levelStory(levelId);
  const doneBeat = finishStory(level.title, score);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (guideTimer.current) clearTimeout(guideTimer.current);
      audio.stopMusic();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [audio]);

  useEffect(() => {
    if (phase !== "story") return;
    speakText(introBeat.spoken);
  }, [phase, storyStep, introBeat.spoken]);

  function clearTimers() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (guideTimer.current) clearTimeout(guideTimer.current);
  }

  async function unlockAudio() {
    await audio.unlock();
    if (!muted && musicOn) await audio.startMusic();
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
  }

  function toggleMusic() {
    const next = !musicOn;
    setMusicOn(next);
    audio.setMusicOn(next);
  }

  function goMenu() {
    clearTimers();
    setPhase("menu");
    setRound(null);
    void unlockAudio();
    void audio.whoosh();
    speakText("Choose how to help Farmer Dot, then pick a pasture.");
  }

  function beginLevel(nextLevel: CountLevelId, nextMode: CountMode) {
    clearTimers();
    void unlockAudio();
    void audio.whoosh();
    setLevelId(nextLevel);
    setMode(nextMode);
    setRoundIndex(0);
    setScore(0);
    setRound(null);
    setPhase("level-intro");
    const beat = levelStory(nextLevel);
    speakText(`${beat.spoken} ${modeStory(nextMode)}`);
  }

  function enterPlay() {
    const first = freshRound(levelId);
    setRound(first);
    setPhase("play");
    void audio.pop();
    promptRound(first, mode);
  }

  function promptRound(next: RoundState, nextMode: CountMode) {
    if (nextMode === "count") {
      if (next.target === 0) {
        speakText("Oh! An empty pasture. How many cows do you see?");
      } else {
        speakText("Count the cows with me. Tap as you go.");
      }
    } else {
      speakText(
        `Farmer Dot needs ${numberPhrase(next.target)}. Tap plus to add cows.`,
      );
    }
  }

  function numberPhrase(n: number) {
    if (n === 0) return "zero cows";
    if (n === 1) return "one cow";
    return `${numberWord(n)} cows`;
  }

  function goNextRound(currentTarget: number, nextScore: number) {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= level.rounds) {
      setPhase("level-done");
      void audio.star();
      speakText(finishStory(level.title, nextScore).spoken);
      return;
    }
    const next = freshRound(levelId, currentTarget);
    setRoundIndex(nextIndex);
    setRound(next);
    void audio.whoosh();
    promptRound(next, mode);
  }

  function onTapCow(index: number) {
    if (!round || round.answered || mode !== "count") return;
    if (round.countedCows[index]) return;
    const countedCows = [...round.countedCows];
    countedCows[index] = true;
    const next = { ...round, countedCows };
    setRound(next);
    void audio.tap();
    void audio.moo();
    speakNumber(tallyCount(next));
  }

  function onTapPen(index: number) {
    if (!round || round.answered || mode !== "count") return;
    if (round.countedPens[index]) return;
    const countedPens = [...round.countedPens];
    countedPens[index] = true;
    const next = { ...round, countedPens };
    setRound(next);
    void audio.pop();
    speakNumber(tallyCount(next));
  }

  function onTapOne(index: number) {
    if (!round || round.answered || mode !== "count") return;
    if (round.countedOnes[index]) return;
    const countedOnes = [...round.countedOnes];
    countedOnes[index] = true;
    const next = { ...round, countedOnes };
    setRound(next);
    void audio.tap();
    speakNumber(tallyCount(next));
  }

  function countWithMe() {
    if (!round || mode !== "count" || round.answered) return;
    if (round.target === 0) {
      speakText("Zero cows");
      setRound({ ...round, guided: true });
      void audio.pop();
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
        void audio.moo();
        return;
      }
      speakNumber(value);
      void audio.tap();
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
      guideTimer.current = setTimeout(tick, 780);
    };
    tick();
  }

  function addCow(amount = 1) {
    if (!round || mode !== "build" || round.answered) return;
    const cap = Math.max(level.max, round.target + 5);
    const built = Math.min(cap, round.built + amount);
    if (built === round.built) return;
    setRound({ ...round, built });
    void audio.pop();
    if (amount >= 10) void audio.moo();
    speakNumber(built);
  }

  function removeCow() {
    if (!round || mode !== "build" || round.answered) return;
    if (round.built <= 0) return;
    const built = round.built - 1;
    setRound({ ...round, built });
    void audio.tap();
    if (built === 0) speakText("zero");
    else speakNumber(built);
  }

  function submitAnswer(value: number) {
    if (!round || round.answered) return;

    if (mode === "count" && round.target > 0 && !fullyCounted(round)) {
      speakText("Count first. Tap cows or pens, or press Count with me.");
      void audio.oops();
      return;
    }

    const guess = mode === "build" ? round.built : value;
    const ok = guess === round.target;
    setRound({ ...round, answered: true, correct: ok });

    if (ok) {
      const nextScore = score + 1;
      setScore(nextScore);
      void audio.success();
      void audio.moo();
      speakText(successStory(round.target, nextScore));
      advanceTimer.current = setTimeout(() => {
        goNextRound(round.target, nextScore);
      }, 1900);
    } else {
      void audio.oops();
      speakText(
        mode === "build"
          ? `Not yet. We need ${numberPhrase(round.target)}. You have ${numberPhrase(round.built)}.`
          : `Not yet. There are ${numberPhrase(round.target)}. Let's try again.`,
      );
    }
  }

  function retryRound() {
    if (!round) return;
    const layout = layoutForCount(round.target);
    const next: RoundState = {
      ...freshRound(levelId, round.target + 1),
      target: round.target,
      choices: round.choices,
      countedCows: Array.from({ length: round.target }, () => false),
      countedPens: Array.from({ length: layout.tens }, () => false),
      countedOnes: Array.from({ length: layout.ones }, () => false),
    };
    setRound(next);
    void audio.whoosh();
    promptRound(next, mode);
  }

  return (
    <div className="mk-shell mk-cowgame">
      <header className="mk-header">
        <div className="mk-header__inner">
          <MenoknowBrand />
          <nav className="mk-nav" aria-label="Primary">
            <button
              type="button"
              className="mk-btn mk-btn--ghost mk-audio-btn"
              onClick={() => {
                void unlockAudio();
                toggleMusic();
              }}
              aria-pressed={musicOn && !muted}
              title={musicOn ? "Music on" : "Music off"}
            >
              {musicOn && !muted ? "Music" : "Music off"}
            </button>
            <button
              type="button"
              className="mk-btn mk-btn--ghost mk-audio-btn"
              onClick={() => {
                void unlockAudio();
                toggleMute();
              }}
              aria-pressed={!muted}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? "Muted" : "Sound"}
            </button>
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
          Help Farmer Dot bring the herd home. Tap, listen, and count from zero
          to one hundred.
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
          {phase === "story" ? (
            <StoryStage
              key={`story-${storyStep}`}
              beat={introBeat}
              step={storyStep + 1}
              total={STORY_INTRO.length}
              cta={storyStep >= STORY_INTRO.length - 1 ? "Let's help!" : "Next"}
              onNext={async () => {
                await unlockAudio();
                void audio.pop();
                if (storyStep >= STORY_INTRO.length - 1) {
                  goMenu();
                  return;
                }
                setStoryStep((s) => s + 1);
              }}
              onSkip={async () => {
                await unlockAudio();
                goMenu();
              }}
            />
          ) : null}

          {phase === "menu" ? (
            <motion.section
              key="menu"
              className="mk-cowgame__menu"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mk-cowgame__cast">
                <FarmerDot />
                <p>
                  Farmer Dot is ready. Pick a way to help, then choose a
                  pasture.
                </p>
              </div>

              <h2>How do you want to play?</h2>
              <div className="mk-cowgame__modes" role="group" aria-label="Game mode">
                <button
                  type="button"
                  className={`mk-mode${mode === "count" ? " is-active" : ""}`}
                  onClick={() => {
                    setMode("count");
                    void audio.tap();
                  }}
                >
                  <strong>Count the herd</strong>
                  <span>See cows → count → pick the number</span>
                </button>
                <button
                  type="button"
                  className={`mk-mode${mode === "build" ? " is-active" : ""}`}
                  onClick={() => {
                    setMode("build");
                    void audio.tap();
                  }}
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
                    onClick={() => beginLevel(item.id, mode)}
                  >
                    <span className="mk-level__range">
                      {item.decadesOnly ? "Tens" : `${item.min}–${item.max}`}
                    </span>
                    <strong>{item.title}</strong>
                    <span>{item.blurb}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="mk-btn mk-btn--ghost"
                onClick={() => {
                  setStoryStep(0);
                  setPhase("story");
                  void audio.whoosh();
                }}
              >
                Replay story
              </button>
            </motion.section>
          ) : null}

          {phase === "level-intro" ? (
            <StoryStage
              key={`level-${levelId}`}
              beat={levelBeat}
              cta="Start counting"
              onNext={enterPlay}
            />
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
                celebrate={round.correct === true}
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
                  {round.choices.map((choice, index) => (
                    <motion.button
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
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      whileTap={{ scale: 0.94 }}
                    >
                      {choice}
                    </motion.button>
                  ))}
                </div>
              ) : null}

              {round.answered ? (
                <motion.div
                  className={`mk-cowgame__feedback${
                    round.correct ? " is-good" : " is-retry"
                  }`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {round.correct ? (
                    <p>{successStory(round.target, score)}</p>
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
                </motion.div>
              ) : null}

              <div className="mk-cowgame__toolbar">
                <button
                  type="button"
                  className="mk-btn mk-btn--ghost"
                  onClick={goMenu}
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
              <div className="mk-cowgame__cast mk-cowgame__cast--done">
                <FarmerDot wave />
                <motion.div
                  className="mk-starburst"
                  aria-hidden
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              </div>
              <h2>{doneBeat.title}</h2>
              <p>{doneBeat.line}</p>
              <div className="mk-cowgame__done-actions">
                <button
                  type="button"
                  className="mk-btn mk-btn--primary mk-btn--lg"
                  onClick={() => beginLevel(levelId, mode)}
                >
                  Play again
                </button>
                <button
                  type="button"
                  className="mk-btn mk-btn--ghost mk-btn--lg"
                  onClick={goMenu}
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
  celebrate,
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
  celebrate: boolean;
  onTapCow: (index: number) => void;
  onTapPen: (index: number) => void;
  onTapOne: (index: number) => void;
}) {
  const displayCount = mode === "count" ? target : built;
  const layout = layoutForCount(displayCount);

  if (displayCount === 0) {
    return (
      <motion.div
        className="mk-pasture mk-pasture--empty"
        aria-label="Empty pasture"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
      >
        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          No cows yet — this is zero.
        </motion.p>
      </motion.div>
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
            key={`${displayCount}-${index}`}
            index={index}
            size={displayCount > 10 ? "sm" : "md"}
            counted={mode === "count" ? countedCows[index] : false}
            celebrate={celebrate}
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
        <motion.button
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
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <span className="mk-pen__label">10</span>
          <span className="mk-pen__cows" aria-hidden>
            {Array.from({ length: 10 }).map((__, cowIndex) => (
              <CowSprite key={cowIndex} size="sm" index={cowIndex} />
            ))}
          </span>
        </motion.button>
      ))}
      {layout.ones > 0 ? (
        <div className="mk-pen mk-pen--ones">
          <span className="mk-pen__label">{layout.ones}</span>
          <span className="mk-pen__cows">
            {Array.from({ length: layout.ones }).map((_, index) => (
              <CowSprite
                key={index}
                size="sm"
                index={index}
                counted={mode === "count" ? countedOnes[index] : false}
                celebrate={celebrate}
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
