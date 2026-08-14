"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  groundVsAir,
  portfolioItems,
  processSteps,
  services,
  stats,
  categoryLabels,
} from "@/lib/drones/content";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export function DronesLanding() {
  const heroRef = useRef<HTMLElement>(null);
  const scaleRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const skyShift = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const gridShift = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroFade = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);
  const droneY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const { scrollYProgress: scaleProgress } = useScroll({
    target: scaleRef,
    offset: ["start 0.45", "end 0.55"],
  });
  const [activeService, setActiveService] = useState(0);
  useMotionValueEvent(scaleProgress, "change", (value) => {
    const next = Math.min(
      services.length - 1,
      Math.max(0, Math.floor(value * services.length)),
    );
    setActiveService(next);
  });

  const featured = portfolioItems.slice(0, 4);

  return (
    <>
      <section className="dr-hero" ref={heroRef}>
        <motion.div
          className="dr-hero__sky"
          style={{ y: skyShift, opacity: heroFade }}
          aria-hidden
        >
          <span className="dr-hero__sun" />
          <span className="dr-hero__haze" />
        </motion.div>
        <motion.div
          className="dr-hero__grid"
          style={{ y: gridShift }}
          aria-hidden
        />
        <motion.div className="dr-hero__drone" style={{ y: droneY }} aria-hidden>
          <span className="dr-quad">
            <span className="dr-quad__arm dr-quad__arm--n" />
            <span className="dr-quad__arm dr-quad__arm--e" />
            <span className="dr-quad__arm dr-quad__arm--s" />
            <span className="dr-quad__arm dr-quad__arm--w" />
            <span className="dr-quad__rotor dr-quad__rotor--nw" />
            <span className="dr-quad__rotor dr-quad__rotor--ne" />
            <span className="dr-quad__rotor dr-quad__rotor--sw" />
            <span className="dr-quad__rotor dr-quad__rotor--se" />
            <span className="dr-quad__body" />
            <span className="dr-quad__beam" />
          </span>
        </motion.div>
        <div className="dr-hero__veil" aria-hidden />

        <motion.div
          className="dr-hero__content"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.p className="dr-kicker" variants={fadeUp}>
            Spleckt Drone Services
          </motion.p>
          <motion.h1 variants={fadeUp}>
            The most complete aerial record of your site.
          </motion.h1>
          <motion.p className="dr-hero__lede" variants={fadeUp}>
            Marketing photo and videography, photogrammetry, 2D and 3D
            orthomosaics, stockpile measurements, site progress documentation,
            virtual tours, and more — flown with the same precision we bring to
            every capture.
          </motion.p>
          <motion.div className="dr-hero__actions" variants={fadeUp}>
            <Link href="/portfolio" className="dr-btn dr-btn--primary dr-btn--lg">
              See the work
            </Link>
            <Link href="/contact" className="dr-btn dr-btn--ghost dr-btn--lg">
              Book a flight
            </Link>
          </motion.div>
        </motion.div>
        <a href="#stack" className="dr-scroll" aria-label="Scroll to services">
          <span />
          Scroll
        </a>
      </section>

      <section className="dr-scale" id="stack" ref={scaleRef}>
        <div className="dr-scale__sticky">
          <p className="dr-kicker">The capture stack</p>
          <h2>We aspire to fly the whole picture</h2>
          <p>
            One program. Six disciplines. The same site, seen for marketing,
            measurement, and the archive.
          </p>
          <p className="dr-scale__index" aria-hidden>
            {services[activeService]?.index}
          </p>
        </div>
        <ol className="dr-scale__list">
          {services.map((service, index) => (
            <li
              key={service.id}
              className={index === activeService ? "is-active" : undefined}
            >
              <span>{service.index}</span>
              <div>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="dr-stats" aria-label="Capabilities">
        {stats.map((stat, index) => (
          <motion.article
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease }}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </motion.article>
        ))}
      </section>

      <section className="dr-compare">
        <div className="dr-compare__intro">
          <p className="dr-kicker">Ground versus air</p>
          <h2>The site is larger than any walkthrough.</h2>
        </div>
        <div className="dr-compare__grid">
          <motion.article
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, ease }}
          >
            <h3>{groundVsAir.ground.title}</h3>
            <ul>
              {groundVsAir.ground.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.article>
          <motion.article
            className="dr-compare__air"
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, ease }}
          >
            <h3>{groundVsAir.air.title}</h3>
            <ul>
              {groundVsAir.air.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.article>
        </div>
      </section>

      <section className="dr-process">
        <div className="dr-section-intro">
          <p className="dr-kicker">From flight plan to hosted link</p>
          <h2>Precision from plan to delivery.</h2>
          <p>
            We plan like surveyors, fly like cinematographers, and deliver like
            a production team — because your site has to work in a board deck
            and a takeoff.
          </p>
        </div>
        <div className="dr-process__rail">
          {processSteps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45, ease }}
            >
              <span>{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="dr-work">
        <div className="dr-section-intro dr-section-intro--row">
          <div>
            <p className="dr-kicker">Selected missions</p>
            <h2>Work from altitude.</h2>
          </div>
          <Link href="/portfolio" className="dr-btn dr-btn--ghost">
            Full portfolio
          </Link>
        </div>
        <div className="dr-work__grid">
          {featured.map((item, index) => (
            <motion.article
              key={item.slug}
              className={`dr-card dr-card--${item.category}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.06, duration: 0.5, ease }}
            >
              <div className="dr-card__visual" aria-hidden>
                <span className="dr-card__scan" />
              </div>
              <div className="dr-card__meta">
                <p className="dr-kicker">{categoryLabels[item.category]}</p>
                <h3>{item.title}</h3>
                <p>{item.location}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="dr-cta">
        <motion.div
          className="dr-cta__panel"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
        >
          <p className="dr-kicker">Ready when the site is</p>
          <h2>Put a Spleckt drone over it.</h2>
          <p>
            Tell us the property, the jobsite, or the question you need
            answered. We&apos;ll propose a flight plan and a deliverable stack.
          </p>
          <div className="dr-hero__actions">
            <Link href="/contact" className="dr-btn dr-btn--primary dr-btn--lg">
              Start a mission
            </Link>
            <Link href="/portfolio" className="dr-btn dr-btn--ghost dr-btn--lg">
              Review the work
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
