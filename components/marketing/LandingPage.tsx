"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ParticleField } from "@/components/marketing/ParticleField";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { LumaEmbedFrame } from "@/components/viewer/LumaEmbedFrame";
import { SplatViewerFrame } from "@/components/viewer/SplatViewerFrame";
import {
  GILBERT_SHOWCASE,
  SHOWCASE_SCENES,
  viewerHrefFor,
  type ShowcaseScene,
} from "@/lib/showcase";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function ShowcaseMedia({ scene }: { scene: ShowcaseScene }) {
  const href = viewerHrefFor(scene);

  // Hero already mounts the live Luma embed — keep showcase light with a poster.
  if (scene.kind === "luma") {
    return (
      <a
        href={href}
        className="showcase-poster"
        target="_blank"
        rel="noreferrer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scene.posterUrl}
          alt={scene.title}
          className="showcase-poster__image"
        />
        <span className="showcase-poster__cta">Open on Luma</span>
      </a>
    );
  }

  if (scene.contentUrl) {
    return (
      <div className="showcase-stage">
        <SplatViewerFrame
          contentUrl={scene.contentUrl}
          settingsUrl={scene.settingsUrl}
          posterUrl={scene.posterUrl}
          title={scene.title}
          className="showcase-stage__frame"
          webgl
        />
      </div>
    );
  }

  return (
    <Link href={href} className="showcase-poster">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={scene.posterUrl}
        alt={scene.title}
        className="showcase-poster__image"
      />
      <span className="showcase-poster__cta">Open interactive viewer</span>
    </Link>
  );
}

export function LandingPage() {
  return (
    <div className="marketing marketing--cinematic">
      <SiteHeader />

      <section className="cinematic-hero" aria-label="Spleckt home">
        <div className="cinematic-hero__stage">
          <LumaEmbedFrame
            embedUrl={GILBERT_SHOWCASE.embedUrl!}
            title={GILBERT_SHOWCASE.title}
            posterUrl={GILBERT_SHOWCASE.posterUrl}
            className="cinematic-hero__splat cinematic-hero__luma"
            lazy={false}
          />
          <ParticleField className="cinematic-hero__particles" density={1.15} />
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
      </section>

      <section className="section showcase-section" id="showcase">
        <div className="section__intro">
          <p className="eyebrow">Live showcase</p>
          <h2>Spaces preserved in lifelike detail.</h2>
          <p>
            A couple of captures to explore — an outdoor park and an urban
            headquarters tour.
          </p>
        </div>

        <div className="showcase-list">
          {SHOWCASE_SCENES.map((scene) => {
            const href = viewerHrefFor(scene);
            const isExternal = href.startsWith("http");

            return (
              <article key={scene.id} className="showcase-item">
                <div className="showcase-item__copy">
                  <h3>{scene.title}</h3>
                  <p>{scene.description}</p>
                </div>

                <ShowcaseMedia scene={scene} />

                <div className="showcase-item__footer">
                  <p className="showcase-credit">
                    Scene by{" "}
                    {scene.authorUrl ? (
                      <a
                        href={scene.authorUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
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
                        <a
                          href={scene.licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {scene.license}
                        </a>
                      </>
                    ) : null}
                  </p>
                  {isExternal ? (
                    <a
                      href={href}
                      className="btn btn--ghost"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open on Luma
                    </a>
                  ) : (
                    <Link href={href} className="btn btn--ghost">
                      Open full viewer
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
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
