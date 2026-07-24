"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { HandoffBrand } from "@/components/handoff/HandoffBrand";

export function HandoffLanding() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const shift = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.4]);
  const laneShift = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <div className="handoff-shell">
      <header className="handoff-header">
        <div className="handoff-header__inner">
          <HandoffBrand />
          <nav className="handoff-nav">
            <Link href="/login">Sign in</Link>
            <Link href="/signup" className="btn btn--primary handoff-btn">
              Take the baton
            </Link>
          </nav>
        </div>
      </header>

      <section className="handoff-hero" ref={heroRef}>
        <motion.div
          className="handoff-hero__visual"
          style={{ y: shift, opacity: fade }}
          aria-hidden
        />
        <motion.div
          className="handoff-hero__lanes"
          style={{ x: laneShift }}
          aria-hidden
        />
        <div className="handoff-hero__content">
          <p className="handoff-brand-hero">Handoff</p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Pass the knowledge. Keep the team moving.
          </motion.h1>
          <motion.p
            className="handoff-hero__lede"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Like a clean baton pass in a relay, Handoff trains the next person up
            — modules, tests, and certifications so nothing gets dropped between
            teammates.
          </motion.p>
          <motion.div
            className="handoff-hero__actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/login" className="btn btn--primary btn--lg handoff-btn">
              Enter the exchange zone
            </Link>
            <Link href="/signup" className="btn btn--ghost btn--lg handoff-btn-ghost">
              Join the relay
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="handoff-section">
        <motion.div
          className="handoff-section__inner"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Train for the exchange</h2>
          <p>
            Every module is a leg of the race: learn the skill, prove it under
            pressure, earn the credential. Then hand it forward — the next
            teammate starts at full speed, not from a standing start.
          </p>
        </motion.div>
      </section>

      <footer className="handoff-footer">
        <span className="handoff-brand__name">Handoff</span>
        <span>Clean passes. Strong teams.</span>
      </footer>
    </div>
  );
}
