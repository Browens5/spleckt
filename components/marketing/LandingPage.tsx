"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";

type MediaItem = {
  id: string;
  title: string;
  description: string;
  kind: "video" | "image" | "splat";
  fileUrl: string;
  posterUrl: string | null;
  splatId: string | null;
};

type FeaturedSplat = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  thumbnailUrl: string | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroShift = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [featured, setFeatured] = useState<FeaturedSplat[]>([]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/media?published=1").then((r) => r.json()),
      fetch("/api/featured").then((r) => r.json()),
    ]).then(([mediaRes, featuredRes]) => {
      setMedia(mediaRes.media ?? []);
      setFeatured(featuredRes.splats ?? []);
    });
  }, []);

  const videos = media.filter((item) => item.kind === "video");
  const exampleSplats =
    featured.length > 0
      ? featured
      : media
          .filter((item) => item.kind === "splat")
          .map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: "scene",
            fileUrl: item.fileUrl,
            thumbnailUrl: item.posterUrl,
          }));

  return (
    <div className="marketing">
      <SiteHeader />

      <section className="hero" ref={heroRef}>
        <motion.div
          className="hero__atmosphere"
          style={{ y: heroShift, opacity: heroFade }}
          aria-hidden
        />
        <div className="hero__veil" aria-hidden />

        <motion.div
          className="hero__content"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.p className="hero__brand" variants={fadeUp}>
            Spleckt
          </motion.p>
          <motion.h1 variants={fadeUp}>
            Hyperrealistic 3D captures for spaces that need to be felt, not just
            photographed.
          </motion.h1>
          <motion.p className="hero__lede" variants={fadeUp}>
            We capture locations, homes, businesses, and construction sites as
            Gaussian Splats — then host them for marketing today and
            documentation tomorrow.
          </motion.p>
          <motion.div className="hero__actions" variants={fadeUp}>
            <Link href="/#contact" className="btn btn--primary btn--lg">
              Request a capture
            </Link>
            <Link href="/#examples" className="btn btn--ghost btn--lg">
              View examples
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="section" id="services">
        <div className="section__intro">
          <p className="eyebrow">Built for real estate & construction</p>
          <h2>Show the space as it truly is.</h2>
          <p>
            Spleckt turns physical environments into navigable 3D assets your
            clients, buyers, and project teams can explore from any device.
          </p>
        </div>

        <div className="service-grid">
          {[
            {
              title: "Listings that linger",
              body: "Let buyers walk rooms, study finishes, and share a link that sells the experience — not a slideshow.",
            },
            {
              title: "Jobsite clarity",
              body: "Document progress with high-fidelity captures teams can revisit for coordination, handoff, and accountability.",
            },
            {
              title: "Hosted & shareable",
              body: "Every splat lives in your portal with public hashed links for clients, partners, and stakeholders.",
            },
          ].map((item, index) => (
            <motion.article
              key={item.title}
              className="service-block"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section section--tint" id="process">
        <div className="section__intro">
          <p className="eyebrow">Capture to hosted splat</p>
          <h2>From site visit to shareable 3D.</h2>
          <p>
            Upload process videos and stills from the portal — they appear here
            automatically as living proof of how Spleckt works.
          </p>
        </div>

        <div className="process-rail">
          {[
            "On-site capture",
            "Gaussian processing",
            "Edit & refine",
            "Host & share",
          ].map((step, index) => (
            <motion.div
              key={step}
              className="process-step"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </motion.div>
          ))}
        </div>

        <div className="media-stage">
          {videos.length === 0 ? (
            <div className="media-empty">
              <p>
                Process videos will appear here once uploaded from the admin
                portal.
              </p>
            </div>
          ) : (
            videos.map((item) => (
              <figure key={item.id} className="media-frame">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={item.posterUrl ?? undefined}
                  src={item.fileUrl}
                />
                <figcaption>
                  <strong>{item.title}</strong>
                  {item.description ? <span>{item.description}</span> : null}
                </figcaption>
              </figure>
            ))
          )}
        </div>
      </section>

      <section className="section" id="examples">
        <div className="section__intro">
          <p className="eyebrow">Example captures</p>
          <h2>Spaces preserved in living detail.</h2>
          <p>
            Featured splats from the portal surface here so visitors can
            experience the fidelity before they book.
          </p>
        </div>

        <div className="example-grid">
          {exampleSplats.length === 0 ? (
            <div className="media-empty">
              <p>
                Feature a splat from the portal to showcase it on the landing
                page.
              </p>
            </div>
          ) : (
            exampleSplats.map((splat, index) => (
              <motion.a
                key={splat.id}
                href={`/viewer?content=${encodeURIComponent(splat.fileUrl)}&title=${encodeURIComponent(splat.title)}`}
                className="example-tile"
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.06 }}
              >
                <div
                  className="example-tile__visual"
                  style={
                    splat.thumbnailUrl
                      ? { backgroundImage: `url(${splat.thumbnailUrl})` }
                      : undefined
                  }
                />
                <div className="example-tile__meta">
                  <p className="eyebrow">{splat.category.replace("-", " ")}</p>
                  <h3>{splat.title}</h3>
                  <p>{splat.description || "Open the interactive 3D viewer"}</p>
                </div>
              </motion.a>
            ))
          )}
        </div>
      </section>

      <section className="section section--cta" id="contact">
        <motion.div
          className="cta-panel"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="eyebrow">Ready when the site is</p>
          <h2>Book a Spleckt capture.</h2>
          <p>
            Tell us about the property, jobsite, or space. We&apos;ll handle
            capture, processing, and hosting — then deliver share-ready links in
            your portal.
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
          <p>Hyperrealistic 3D Gaussian Splats for marketing and documentation.</p>
        </div>
        <div className="site-footer__links">
          <Link href="/login">Portal</Link>
          <a href="mailto:hello@spleckt.com">Contact</a>
        </div>
      </footer>
    </div>
  );
}
