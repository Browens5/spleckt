"use client";

import { motion, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type CertificationMedalData = {
  id: string;
  code: string;
  issuedAt: Date | string | number;
  moduleTitle: string;
  moduleSlug: string;
  moduleKind: string;
};

const KIND_THEME: Record<
  string,
  {
    label: string;
    rim: string;
    accent: string;
    glow: string;
    ribbon: [string, string];
  }
> = {
  tool: {
    label: "Tool",
    rim: "#b87333",
    accent: "#fff1d6",
    glow: "rgba(198, 134, 66, 0.45)",
    ribbon: ["#8b1e1e", "#d6452e"],
  },
  software: {
    label: "Software",
    rim: "#8a93a3",
    accent: "#ffffff",
    glow: "rgba(140, 150, 170, 0.45)",
    ribbon: ["#2f3b52", "#6b7c99"],
  },
  technique: {
    label: "Technique",
    rim: "#c9a227",
    accent: "#fff8d6",
    glow: "rgba(226, 182, 53, 0.5)",
    ribbon: ["#7a1515", "#e0352d"],
  },
  module: {
    label: "Module",
    rim: "#4f6d8c",
    accent: "#eef6ff",
    glow: "rgba(79, 109, 140, 0.45)",
    ribbon: ["#1f3b63", "#4f79b0"],
  },
};

const SLUG_PHOTOS: Record<string, string> = {
  "xgrids-portalcam-construction": "/handoff/medals/portalcam.png",
};

const KIND_PHOTOS: Record<string, string> = {
  tool: "/handoff/medals/portalcam.png",
  software: "/handoff/medals/software.png",
  technique: "/handoff/medals/technique.png",
  module: "/handoff/medals/module.png",
};

function themeFor(kind: string) {
  return KIND_THEME[kind] ?? KIND_THEME.module;
}

function photoFor(slug: string, kind: string) {
  return SLUG_PHOTOS[slug] ?? KIND_PHOTOS[kind] ?? KIND_PHOTOS.module;
}

function formatIssued(value: Date | string | number) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CertificationMedalGallery({
  certifications,
}: {
  certifications: CertificationMedalData[];
}) {
  return (
    <div className="ho-medal-gallery">
      {certifications.map((cert, index) => (
        <CertificationMedalCard key={cert.id} cert={cert} index={index} />
      ))}
    </div>
  );
}

function ribbonFill(colors: [string, string]) {
  const [deep, bright] = colors;
  return `repeating-linear-gradient(
    90deg,
    ${deep} 0 6px,
    ${bright} 6px 12px,
    #f4f1e8 12px 16px,
    ${bright} 16px 22px,
    ${deep} 22px 28px
  )`;
}

function MedalLanyard({ colors }: { colors: [string, string] }) {
  const fill = ribbonFill(colors);
  return (
    <div className="ho-lanyard" aria-hidden>
      <span className="ho-lanyard__strap ho-lanyard__strap--left" style={{ background: fill }} />
      <span className="ho-lanyard__strap ho-lanyard__strap--right" style={{ background: fill }} />
      <span className="ho-lanyard__neck" style={{ background: fill }} />
      <span className="ho-lanyard__join" />
      <span className="ho-lanyard__ring" />
    </div>
  );
}

function Medallion({
  theme,
  photoSrc,
  alt,
  size = "full",
}: {
  theme: ReturnType<typeof themeFor>;
  photoSrc: string;
  alt: string;
  size?: "full" | "banner";
}) {
  return (
    <div
      className={`ho-medal${size === "banner" ? " ho-medal--banner" : ""}`}
      style={{
        ["--medal-rim" as string]: theme.rim,
        ["--medal-accent" as string]: theme.accent,
        ["--medal-glow" as string]: theme.glow,
      }}
    >
      <div className="ho-medal__bail" aria-hidden />
      <div className="ho-medal__ring" />
      <div className="ho-medal__core">
        <div className="ho-medal__photo">
          <Image src={photoSrc} alt={alt} fill sizes="160px" className="ho-medal__img" />
        </div>
        <div className="ho-medal__caption">
          <strong>Certified</strong>
          <em>{theme.label}</em>
        </div>
      </div>
    </div>
  );
}

export function CertificationMedalCard({
  cert,
  index = 0,
  compact = false,
}: {
  cert: CertificationMedalData;
  index?: number;
  compact?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const theme = themeFor(cert.moduleKind);
  const photoSrc = photoFor(cert.moduleSlug, cert.moduleKind);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-40, 40], [10, -10]);
  const rotateY = useTransform(x, [-40, 40], [-12, 12]);
  const shine = useMotionTemplate`linear-gradient(${useTransform(x, [-40, 40], [120, 210])}deg, transparent 30%, rgba(255,255,255,0.7) 48%, transparent 62%)`;

  function onMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.article
      className={`ho-medal-card${compact ? " ho-medal-card--compact" : ""}`}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        className={`ho-medal-stage${flipped ? " is-flipped" : ""}`}
        aria-pressed={flipped}
        aria-label={`${cert.moduleTitle} certification medal. Click to flip.`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={() => setFlipped((value) => !value)}
      >
        <MedalLanyard colors={theme.ribbon} />
        <motion.div
          className="ho-medal-tilt"
          style={{
            rotateX: flipped ? 0 : rotateX,
            rotateY: flipped ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            className="ho-medal-flip"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="ho-medal-face ho-medal-face--front ho-medal-face--hanging">
              <motion.div className="ho-medal-shine" style={{ background: shine }} />
              <div className="ho-medal-sparks" aria-hidden>
                {Array.from({ length: 8 }).map((_, spark) => (
                  <span key={spark} style={{ ["--s" as string]: spark }} />
                ))}
              </div>
              <Medallion
                theme={theme}
                photoSrc={photoSrc}
                alt={`${cert.moduleTitle} tool photo`}
              />
              <p className="ho-medal-hint">Click to inspect</p>
            </div>

            <div className="ho-medal-face ho-medal-face--back">
              <div className="ho-medal-back">
                <span className="ho-medal-back__kind">{theme.label}</span>
                <h3>{cert.moduleTitle}</h3>
                <p>
                  Issued{" "}
                  <time dateTime={new Date(cert.issuedAt).toISOString()}>
                    {formatIssued(cert.issuedAt)}
                  </time>
                </p>
                <code>{cert.code}</code>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </button>

      {!compact ? (
        <div className="ho-medal-meta">
          <h2>{cert.moduleTitle}</h2>
          <p>
            <span>{theme.label}</span>
            <span aria-hidden>·</span>
            <time dateTime={new Date(cert.issuedAt).toISOString()}>
              {formatIssued(cert.issuedAt)}
            </time>
          </p>
          <Link href={`/center/modules/${cert.moduleSlug}`}>View module</Link>
        </div>
      ) : null}
    </motion.article>
  );
}

export function EarnedMedalBanner({
  code,
  moduleKind = "module",
  moduleTitle,
  moduleSlug,
}: {
  code: string;
  moduleKind?: string;
  moduleTitle?: string;
  moduleSlug?: string;
}) {
  const theme = themeFor(moduleKind);
  const photoSrc = photoFor(moduleSlug ?? "", moduleKind);
  return (
    <motion.div
      className="ho-medal-banner"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 14 }}
    >
      <div className="ho-medal-banner__award">
        <MedalLanyard colors={theme.ribbon} />
        <Medallion
          theme={theme}
          photoSrc={photoSrc}
          alt={moduleTitle ? `${moduleTitle} medal` : "Certification medal"}
          size="banner"
        />
      </div>
      <div>
        <h3>{moduleTitle ? `${moduleTitle} unlocked` : "Certification earned"}</h3>
        <p>
          Medal code <code>{code}</code>
        </p>
      </div>
    </motion.div>
  );
}
