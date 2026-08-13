"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ParticleField } from "@/components/marketing/ParticleField";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SplatViewerFrame } from "@/components/viewer/SplatViewerFrame";
import { WEITZ_SHOWCASE } from "@/lib/showcase";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export function LandingPage() {
  const viewerHref = `/viewer?content=${encodeURIComponent(WEITZ_SHOWCASE.contentUrl)}&title=${encodeURIComponent(WEITZ_SHOWCASE.title)}&poster=${encodeURIComponent(WEITZ_SHOWCASE.posterUrl)}&settings=${encodeURIComponent(WEITZ_SHOWCASE.settingsUrl)}`;

  return (
    <div className="marketing marketing--cinematic">
      <SiteHeader />

      <section className="cinematic-hero" aria-label="Spleckt home">
        <div className="cinematic-hero__stage">
          <SplatViewerFrame
            contentUrl={WEITZ_SHOWCASE.contentUrl}
            settingsUrl={WEITZ_SHOWCASE.settingsUrl}
            posterUrl={WEITZ_SHOWCASE.posterUrl}
            title={WEITZ_SHOWCASE.title}
            className="cinematic-hero__splat"
            noui
            webgl
          />
          <ParticleField className="cinematic-hero__particles" />
          <div className="cinematic-hero__veil" aria-hidden />
        </div>

        <motion.div
          className="cinematic-hero__content"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.14, delayChildren: 0.15 }}
        >
          <motion.p className="cinematic-hero__brand" variants={fadeUp}>
            Spleckt
          </motion.p>
          <motion.h1 variants={fadeUp}>Walk the space in lifelike 3D.</motion.h1>
          <motion.p className="cinematic-hero__lede" variants={fadeUp}>
            Captures you can explore, share, and keep — for listings, jobsites,
            and places that deserve more than photos.
          </motion.p>
          <motion.div className="hero__actions" variants={fadeUp}>
            <Link href={viewerHref} className="btn btn--primary btn--lg">
              Explore this capture
            </Link>
            <Link
              href="/#contact"
              className="btn btn--ghost btn--lg btn--on-media"
            >
              Request a capture
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="section showcase-section" id="showcase">
        <div className="section__intro">
          <p className="eyebrow">Live showcase</p>
          <h2>{WEITZ_SHOWCASE.title}</h2>
          <p>{WEITZ_SHOWCASE.description}</p>
        </div>

        <Link href={viewerHref} className="showcase-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WEITZ_SHOWCASE.posterUrl}
            alt={WEITZ_SHOWCASE.title}
            className="showcase-poster__image"
          />
          <span className="showcase-poster__cta">Open interactive viewer</span>
        </Link>

        <p className="showcase-credit">
          Scene by{" "}
          <a href={WEITZ_SHOWCASE.authorUrl} target="_blank" rel="noreferrer">
            {WEITZ_SHOWCASE.author}
          </a>
          {" · "}
          <a href={WEITZ_SHOWCASE.sourceUrl} target="_blank" rel="noreferrer">
            SuperSplat
          </a>
          {" · "}
          <a href={WEITZ_SHOWCASE.licenseUrl} target="_blank" rel="noreferrer">
            {WEITZ_SHOWCASE.license}
          </a>
        </p>
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
