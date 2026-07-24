"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

export function HandoffLanding() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const shift = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.4]);

  return (
    <div className="handoff-shell">
      <header className="handoff-header">
        <div className="handoff-header__inner">
          <Link href="/" className="handoff-brand">
            <span className="handoff-brand__mark" aria-hidden />
            <span className="handoff-brand__name">Handoff</span>
          </Link>
          <nav className="handoff-nav">
            <Link href="/login">Sign in</Link>
            <Link href="/signup" className="btn btn--primary handoff-btn">
              Start training
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
        <div className="handoff-hero__content">
          <p className="handoff-brand-hero">Handoff</p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Train, test, and certify what you know.
          </motion.h1>
          <motion.p
            className="handoff-hero__lede"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Focused modules for tools, software, and techniques — with a
            certification for every skill you complete.
          </motion.p>
          <motion.div
            className="handoff-hero__actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/login" className="btn btn--primary btn--lg handoff-btn">
              Enter training center
            </Link>
            <Link href="/signup" className="btn btn--ghost btn--lg handoff-btn-ghost">
              Create an account
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
          <h2>One path per skill</h2>
          <p>
            Study the module, pass the test, earn the credential. Progress stays
            with your account whether you signed in here or already have access
            from your shared workspace credentials.
          </p>
        </motion.div>
      </section>

      <footer className="handoff-footer">
        <span className="handoff-brand__name">Handoff</span>
        <span>Training center</span>
      </footer>
    </div>
  );
}
