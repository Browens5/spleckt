"use client";

import { motion } from "framer-motion";
import type { StoryBeat } from "@/lib/menoknow/cow-story";

export function FarmerDot({ wave = false }: { wave?: boolean }) {
  return (
    <motion.div
      className="mk-farmer"
      aria-hidden
      animate={wave ? { rotate: [0, -6, 6, 0] } : { y: [0, -4, 0] }}
      transition={{ duration: wave ? 0.9 : 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="mk-farmer__hat" />
      <span className="mk-farmer__head" />
      <span className="mk-farmer__body" />
    </motion.div>
  );
}

export function StoryStage({
  beat,
  step,
  total,
  onNext,
  onSkip,
  cta = "Next",
}: {
  beat: StoryBeat;
  step?: number;
  total?: number;
  onNext: () => void;
  onSkip?: () => void;
  cta?: string;
}) {
  return (
    <motion.section
      className="mk-story"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mk-story__stage">
        <motion.div
          className="mk-story__sky"
          animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          aria-hidden
        />
        <motion.div
          className="mk-story__hill"
          animate={{ x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <FarmerDot wave />
        <motion.div
          className="mk-story__cow-walk"
          animate={{ x: ["-10%", "110%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          aria-hidden
        >
          <span className="mk-story__mini-cow" />
          <span className="mk-story__mini-cow mk-story__mini-cow--2" />
        </motion.div>
      </div>

      <div className="mk-story__copy">
        {step != null && total != null ? (
          <p className="mk-story__progress">
            Story {step} / {total}
          </p>
        ) : null}
        <h2>{beat.title}</h2>
        <p>{beat.line}</p>
        <div className="mk-story__actions">
          <button type="button" className="mk-btn mk-btn--primary mk-btn--lg" onClick={onNext}>
            {cta}
          </button>
          {onSkip ? (
            <button type="button" className="mk-btn mk-btn--ghost" onClick={onSkip}>
              Skip story
            </button>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
