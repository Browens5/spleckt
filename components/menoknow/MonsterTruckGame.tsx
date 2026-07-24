"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { LetterPicture } from "@/components/menoknow/LetterPicture";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";
import {
  MonsterTruckSprite,
  type TruckPose,
} from "@/components/menoknow/MonsterTruckSprite";
import { getTruckAudio } from "@/lib/menoknow/truck-audio";
import {
  freshTruckRound,
  getTruckLevel,
  promptSpeech,
  randomTrick,
  TRUCK_LEVELS,
  type TruckLevelId,
  type TruckRound,
} from "@/lib/menoknow/truck-letters";
import { speakLetter, speakText } from "@/lib/menoknow/speech";

type Phase = "menu" | "play" | "done";

const SPEED_LABELS = ["Stalled", "Slow", "Rolling", "Turbo"] as const;

export function MonsterTruckGame() {
  const liveId = useId();
  const audio = getTruckAudio();
  const [phase, setPhase] = useState<Phase>("menu");
  const [levelId, setLevelId] = useState<TruckLevelId>("listen-af");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [round, setRound] = useState<TruckRound | null>(null);
  const [pose, setPose] = useState<TruckPose>("idle");
  const [trickName, setTrickName] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const level = getTruckLevel(levelId);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (poseTimer.current) clearTimeout(poseTimer.current);
      audio.stopMusic();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [audio]);

  function clearTimers() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (poseTimer.current) clearTimeout(poseTimer.current);
  }

  async function unlockAudio() {
    await audio.unlock();
    if (!muted && musicOn) await audio.startMusic();
  }

  function speakRound(next: TruckRound) {
    speakText(promptSpeech(next));
  }

  function startLevel(id: TruckLevelId) {
    clearTimers();
    void unlockAudio();
    void audio.engine();
    setLevelId(id);
    setRoundIndex(0);
    setScore(0);
    setProgress(0);
    setSpeed(2);
    setPose("drive");
    setTrickName(null);
    setLastCorrect(null);
    setLocked(false);
    const first = freshTruckRound(getTruckLevel(id));
    setRound(first);
    setPhase("play");
    speakRound(first);
  }

  function goMenu() {
    clearTimers();
    setPhase("menu");
    setRound(null);
    setPose("idle");
    setTrickName(null);
    setLocked(false);
    void audio.whoosh();
    speakText("Pick a track. Listen, match cases, or match pictures.");
  }

  function replayPrompt() {
    if (!round) return;
    void audio.tap();
    if (round.mode === "listen") {
      speakLetter(round.target.letter);
      window.setTimeout(() => speakRound(round), 700);
    } else {
      speakRound(round);
    }
  }

  function nextRound(avoidLetter: string, nextScore: number, nextProgress: number) {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= level.rounds || nextProgress >= 100) {
      setPhase("done");
      setPose("trick");
      void audio.trick();
      speakText(
        `Finish line! You landed ${nextScore} trick${nextScore === 1 ? "" : "s"} on ${level.title}.`,
      );
      return;
    }
    const next = freshTruckRound(level, avoidLetter);
    setRoundIndex(nextIndex);
    setRound(next);
    setLocked(false);
    setLastCorrect(null);
    setTrickName(null);
    setPose(speed <= 0 ? "stall" : "drive");
    speakRound(next);
  }

  function onPick(choiceId: string) {
    if (!round || locked) return;
    setLocked(true);
    const ok = choiceId === round.answerId;

    if (ok) {
      const nextSpeed = Math.min(3, speed + 1);
      const bump = Math.round(100 / level.rounds);
      const nextProgress = Math.min(100, progress + bump);
      const nextScore = score + 1;
      const trick = randomTrick();
      setSpeed(nextSpeed);
      setProgress(nextProgress);
      setScore(nextScore);
      setLastCorrect(true);
      setTrickName(trick);
      setPose("jump");
      void audio.jump();
      poseTimer.current = setTimeout(() => {
        setPose("trick");
        void audio.trick();
      }, 280);
      speakText(`Yes! ${trick}`);
      advanceTimer.current = setTimeout(() => {
        nextRound(round.target.letter, nextScore, nextProgress);
      }, 1600);
    } else {
      const nextSpeed = Math.max(0, speed - 1);
      setSpeed(nextSpeed);
      setLastCorrect(false);
      setTrickName(null);
      setPose("stall");
      void audio.stall();
      speakText(
        `Not that one. We need ${round.target.letter}. The truck slowed down.`,
      );
      advanceTimer.current = setTimeout(() => {
        setLocked(false);
        setLastCorrect(null);
        setPose(nextSpeed <= 0 ? "stall" : "drive");
      }, 1400);
    }
  }

  return (
    <div className="mk-shell mk-truckgame">
      <header className="mk-header">
        <div className="mk-header__inner">
          <MenoknowBrand />
          <nav className="mk-nav" aria-label="Primary">
            <button
              type="button"
              className="mk-btn mk-btn--ghost mk-audio-btn"
              onClick={() => {
                void unlockAudio();
                const next = !musicOn;
                setMusicOn(next);
                audio.setMusicOn(next);
              }}
              aria-pressed={musicOn && !muted}
            >
              {musicOn && !muted ? "Music" : "Music off"}
            </button>
            <button
              type="button"
              className="mk-btn mk-btn--ghost mk-audio-btn"
              onClick={() => {
                void unlockAudio();
                const next = !muted;
                setMuted(next);
                audio.setMuted(next);
              }}
              aria-pressed={!muted}
            >
              {muted ? "Muted" : "Sound"}
            </button>
            <Link href="/play/trucks">Trucks</Link>
            <Link href="/" className="mk-btn mk-btn--ghost">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mk-truckgame__main">
        <p className="mk-coming__eyebrow">Monster Trucks · Letters</p>
        <h1>Letter Rally</h1>
        <p className="mk-truckgame__lede">
          Pick the right letter to rev the monster truck, hit the jump, and stick
          a trick. Wrong letters slow you down.
        </p>

        <div className="mk-truckgame__live" id={liveId} aria-live="polite">
          {phase === "play" && round
            ? lastCorrect === true
              ? trickName ?? "Nice jump!"
              : lastCorrect === false
                ? "Truck slowed down. Try again."
                : promptSpeech(round)
            : null}
        </div>

        <AnimatePresence mode="wait">
          {phase === "menu" ? (
            <motion.section
              key="menu"
              className="mk-truckgame__menu"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mk-truckgame__hero-card">
                <MonsterTruckSprite pose="drive" />
                <p>
                  Three ways to race: listen for a letter, match big and little
                  letters, or match the picture&apos;s starting letter.
                </p>
              </div>

              <h2>Pick a track</h2>
              <div className="mk-truckgame__levels">
                {TRUCK_LEVELS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`mk-level mk-level--${item.mode}`}
                    onClick={() => startLevel(item.id)}
                  >
                    <span className="mk-level__range">
                      {item.mode === "listen"
                        ? "Listen"
                        : item.mode === "case"
                          ? "Aa"
                          : "Picture"}
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
              key={`play-${roundIndex}-${round.answerId}`}
              className="mk-truckgame__play"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mk-truckgame__status">
                <span>
                  Jump {roundIndex + 1} / {level.rounds}
                </span>
                <span>{level.title}</span>
                <span>Tricks {score}</span>
                <span>{SPEED_LABELS[speed]}</span>
              </div>

              <Track
                progress={progress}
                pose={pose}
                speed={speed}
                trickName={trickName}
              />

              <div className="mk-truckgame__prompt">
                <Prompt round={round} onReplay={replayPrompt} />
              </div>

              <div
                className="mk-truckgame__choices"
                role="group"
                aria-label="Letter choices"
              >
                {round.choices.map((choice, index) => (
                  <motion.button
                    key={choice.id}
                    type="button"
                    className={`mk-letter-choice${
                      locked && choice.id === round.answerId && lastCorrect
                        ? " is-correct"
                        : ""
                    }${
                      locked && lastCorrect === false && choice.id !== round.answerId
                        ? " is-dim"
                        : ""
                    }`}
                    onClick={() => onPick(choice.id)}
                    disabled={locked}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    {choice.label}
                  </motion.button>
                ))}
              </div>

              <div className="mk-truckgame__toolbar">
                <button
                  type="button"
                  className="mk-btn mk-btn--ghost"
                  onClick={replayPrompt}
                  disabled={locked}
                >
                  Hear again
                </button>
                <button
                  type="button"
                  className="mk-btn mk-btn--ghost"
                  onClick={goMenu}
                >
                  Change track
                </button>
              </div>
            </motion.section>
          ) : null}

          {phase === "done" ? (
            <motion.section
              key="done"
              className="mk-truckgame__done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <MonsterTruckSprite pose="trick" />
              <h2>Finish line!</h2>
              <p>
                You finished <strong>{level.title}</strong> with {score} trick
                {score === 1 ? "" : "s"}.
              </p>
              <div className="mk-truckgame__done-actions">
                <button
                  type="button"
                  className="mk-btn mk-btn--primary mk-btn--lg"
                  onClick={() => startLevel(levelId)}
                >
                  Race again
                </button>
                <button
                  type="button"
                  className="mk-btn mk-btn--ghost mk-btn--lg"
                  onClick={goMenu}
                >
                  Pick another track
                </button>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Prompt({
  round,
  onReplay,
}: {
  round: TruckRound;
  onReplay: () => void;
}) {
  if (round.mode === "listen") {
    return (
      <div className="mk-truck-prompt mk-truck-prompt--listen">
        <p>Listen for the letter, then steer to it.</p>
        <button
          type="button"
          className="mk-btn mk-btn--primary mk-btn--lg"
          onClick={onReplay}
        >
          Hear letter
        </button>
      </div>
    );
  }

  if (round.mode === "case") {
    return (
      <div className="mk-truck-prompt mk-truck-prompt--case">
        <p>
          Match the{" "}
          {round.promptCase === "upper" ? "little" : "big"} letter partner.
        </p>
        <span className="mk-truck-prompt__glyph" aria-hidden>
          {round.promptLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="mk-truck-prompt mk-truck-prompt--picture">
      <p>
        {round.target.letter === "X"
          ? "Which letter ends this word?"
          : "Which letter starts this picture?"}
      </p>
      <LetterPicture id={round.target.picture} word={round.target.word} />
    </div>
  );
}

function Track({
  progress,
  pose,
  speed,
  trickName,
}: {
  progress: number;
  pose: TruckPose;
  speed: number;
  trickName: string | null;
}) {
  return (
    <div className="mk-track" aria-hidden>
      <div className="mk-track__sky" />
      <div className="mk-track__ramp" />
      <div className="mk-track__dirt">
        <div className="mk-track__dashes" />
        <motion.div
          className="mk-track__truck-wrap"
          animate={{ left: `calc(${Math.min(progress, 92)}% - 2rem)` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <MonsterTruckSprite pose={pose} compact />
        </motion.div>
        <div className="mk-track__finish" />
      </div>
      <div className="mk-track__meter">
        <span>Track</span>
        <div className="mk-track__bar">
          <motion.span
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          />
        </div>
        <span className={`mk-track__speed mk-track__speed--${speed}`}>
          {SPEED_LABELS[speed]}
        </span>
      </div>
      <AnimatePresence>
        {trickName ? (
          <motion.p
            className="mk-track__trick"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {trickName}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
