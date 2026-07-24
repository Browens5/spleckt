"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { MenoknowBrand } from "@/components/menoknow/MenoknowBrand";

const themes = [
  {
    id: "trucks",
    href: "/play/trucks",
    title: "Monster Trucks",
    blurb: "Crash through letters and big loud sounds.",
    accent: "trucks",
    cta: "Coming soon — peek inside",
  },
  {
    id: "build",
    href: "/play/build",
    title: "Construction",
    blurb: "Stack numbers, dig shapes, build brains.",
    accent: "build",
    cta: "Coming soon — peek inside",
  },
  {
    id: "farm",
    href: "/play/farm",
    title: "Cow Farm",
    blurb: "Count cows from zero to one hundred.",
    accent: "farm",
    cta: "Play count the cows",
  },
] as const;

const skills = [
  { label: "Letters", note: "A–Z adventures" },
  {
    label: "Numbers",
    note: "0–100 cow counting",
  },
  { label: "Activities", note: "Simple play skills" },
] as const;

export function MenoknowLanding() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const skyShift = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const truckShift = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.45]);

  return (
    <div className="mk-shell">
      <header className="mk-header">
        <div className="mk-header__inner">
          <MenoknowBrand />
          <nav className="mk-nav" aria-label="Primary">
            <a href="#play-zones">Play zones</a>
            <Link href="/play" className="mk-btn mk-btn--primary">
              Let&apos;s play
            </Link>
          </nav>
        </div>
      </header>

      <section className="mk-hero" ref={heroRef}>
        <motion.div
          className="mk-hero__sky"
          style={{ y: skyShift, opacity: fade }}
          aria-hidden
        />
        <motion.div
          className="mk-hero__yard"
          style={{ y: truckShift }}
          aria-hidden
        >
          <div className="mk-hero__hills" />
          <div className="mk-hero__road" />
          <div className="mk-hero__truck">
            <span className="mk-hero__truck-body" />
            <span className="mk-hero__truck-cab" />
            <span className="mk-hero__truck-wheel mk-hero__truck-wheel--front" />
            <span className="mk-hero__truck-wheel mk-hero__truck-wheel--rear" />
            <span className="mk-hero__truck-block">A</span>
          </div>
          <div className="mk-hero__cow">
            <span className="mk-hero__cow-body" />
            <span className="mk-hero__cow-head" />
            <span className="mk-hero__cow-spot" />
          </div>
          <div className="mk-hero__crane">
            <span className="mk-hero__crane-arm" />
            <span className="mk-hero__crane-hook" />
            <span className="mk-hero__crane-block">3</span>
          </div>
        </motion.div>

        <div className="mk-hero__content">
          <p className="mk-brand-hero">MenoKnow</p>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Play big. Learn fast.
          </motion.h1>
          <motion.p
            className="mk-hero__lede"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            A sunny game yard for little boys — letters, numbers, and simple
            activities with trucks, diggers, and cows.
          </motion.p>
          <motion.div
            className="mk-hero__actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <a href="#play-zones" className="mk-btn mk-btn--primary mk-btn--lg">
              Pick a play zone
            </a>
          </motion.div>
        </div>
      </section>

      <section className="mk-section" id="play-zones">
        <motion.div
          className="mk-section__intro"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.45 }}
        >
          <h2>Choose your adventure</h2>
          <p>Tap a world. Games for letters, numbers, and activities come next.</p>
        </motion.div>

        <div className="mk-zones" role="list">
          {themes.map((theme, index) => (
            <motion.div
              key={theme.id}
              role="listitem"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Link
                href={theme.href}
                className={`mk-zone mk-zone--${theme.accent}`}
              >
                <span className="mk-zone__art" aria-hidden />
                <span className="mk-zone__copy">
                  <span className="mk-zone__title">{theme.title}</span>
                  <span className="mk-zone__blurb">{theme.blurb}</span>
                  <span className="mk-zone__cta">{theme.cta}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mk-section mk-section--skills">
        <motion.div
          className="mk-section__intro"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45 }}
        >
          <h2>What we practice</h2>
          <p>Short, joyful reps made for ages three and four.</p>
        </motion.div>
        <ul className="mk-skills">
          {skills.map((skill) => (
            <li key={skill.label} className="mk-skill">
              <strong>{skill.label}</strong>
              <span>{skill.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mk-footer">
        <span className="mk-brand__name">MenoKnow</span>
        <span>Made for curious little builders.</span>
      </footer>
    </div>
  );
}
