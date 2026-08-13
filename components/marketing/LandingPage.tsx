"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import {
  SHOWCASE_SCENES,
  viewerHrefFor,
  type ShowcaseScene,
} from "@/lib/showcase";

const SplatExperience = dynamic(
  () =>
    import("@/components/marketing/SplatExperience").then(
      (mod) => mod.SplatExperience,
    ),
  { ssr: false },
);

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function ShowcaseCard({ scene }: { scene: ShowcaseScene }) {
  const href = viewerHrefFor(scene);
  const external = href.startsWith("http");

  const media = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={scene.posterUrl}
        alt={scene.title}
        className="showcase-poster__image"
      />
      <span className="showcase-poster__cta">
        {scene.kind === "luma" ? "Open on Luma" : "Open interactive viewer"}
      </span>
    </>
  );

  return (
    <article className="showcase-item">
      <div className="showcase-item__copy">
        <h3>{scene.title}</h3>
        <p>{scene.description}</p>
      </div>

      {external ? (
        <a
          href={href}
          className="showcase-poster"
          target="_blank"
          rel="noreferrer"
        >
          {media}
        </a>
      ) : (
        <Link href={href} className="showcase-poster">
          {media}
        </Link>
      )}

      <div className="showcase-item__footer">
        <p className="showcase-credit">
          Scene by{" "}
          {scene.authorUrl ? (
            <a href={scene.authorUrl} target="_blank" rel="noreferrer">
              {scene.author}
            </a>
          ) : (
            scene.author
          )}
          {" · "}
          <a href={scene.sourceUrl} target="_blank" rel="noreferrer">
            {scene.kind === "luma" ? "Luma" : "SuperSplat"}
          </a>
          {scene.license && scene.licenseUrl ? (
            <>
              {" · "}
              <a href={scene.licenseUrl} target="_blank" rel="noreferrer">
                {scene.license}
              </a>
            </>
          ) : null}
        </p>
      </div>
    </article>
  );
}

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const cameraProgress = useTransform(scrollYProgress, [0, 0.9], [0, 1]);
  const contentFade = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const contentShift = useTransform(scrollYProgress, [0, 0.45], [0, -36]);
  const [progress, setProgress] = useState(0);

  useMotionValueEvent(cameraProgress, "change", (latest) => {
    setProgress(latest);
  });

  return (
    <div className="marketing marketing--cinematic">
      <SiteHeader />

      <section
        className="cinematic-hero"
        aria-label="Spleckt home"
        ref={heroRef}
      >
        <div className="cinematic-hero__stage">
          <SplatExperience
            className="cinematic-hero__splat cinematic-hero__experience"
            scrollProgress={progress}
          />
          <div className="cinematic-hero__veil" aria-hidden />

          <motion.div
            className="cinematic-hero__content"
            style={{ opacity: contentFade, y: contentShift }}
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.14, delayChildren: 0.2 }}
          >
            <motion.p className="cinematic-hero__brand" variants={fadeUp}>
              Spleckt
            </motion.p>
            <motion.h1 variants={fadeUp}>
              Walk the space in lifelike 3D.
            </motion.h1>
            <motion.p className="cinematic-hero__lede" variants={fadeUp}>
              Captures you can explore, share, and keep — for listings,
              jobsites, and places that deserve more than photos.
            </motion.p>
            <motion.div className="hero__actions" variants={fadeUp}>
              <Link href="/#showcase" className="btn btn--primary btn--lg">
                Explore captures
              </Link>
              <Link
                href="/#contact"
                className="btn btn--ghost btn--lg btn--on-media"
              >
                Request a capture
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="section showcase-section" id="showcase">
        <div className="section__intro">
          <p className="eyebrow">Live showcase</p>
          <h2>Spaces preserved in lifelike detail.</h2>
          <p>
            Scroll the hero to move through headquarters — then open either
            capture in a full viewer.
          </p>
        </div>

        <div className="showcase-list">
          {SHOWCASE_SCENES.map((scene) => (
            <ShowcaseCard key={scene.id} scene={scene} />
          ))}
        </div>
      </section>

      <section className="section section--cta" id="contact">
        <motion.div
          className="cta-panel cta-panel--simple"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="eyebrow">Book a capture</p>
          <h2>Ready when the site is.</h2>
          <p>
            Tell us about the property, jobsite, or space. We handle capture,
            processing, and hosting — then deliver share-ready links in your
            portal.
          </p>
          <div className="hero__actions">
            <a
              href="mailto:hello@spleckt.com?subject=Spleckt%20capture%20request"
              className="btn btn--primary btn--lg"
            >
              Email hello@spleckt.com
            </a>
            <Link href="/login" className="btn btn--ghost btn--lg">
              Open client portal
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="site-footer">
        <div>
          <strong>Spleckt</strong>
          <p>Lifelike 3D captures for marketing and documentation.</p>
        </div>
        <div className="site-footer__links">
          <Link href="/login">Portal</Link>
          <a href="mailto:hello@spleckt.com">Contact</a>
        </div>
      </footer>
    </div>
  );
}
