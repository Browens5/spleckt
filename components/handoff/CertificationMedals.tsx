"use client";

import { motion, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
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
  { label: string; rim: string; face: string; accent: string; glow: string }
> = {
  tool: {
    label: "Tool",
    rim: "#b87333",
    face: "linear-gradient(145deg, #f0c27b 0%, #c68642 45%, #8a4b1f 100%)",
    accent: "#fff1d6",
    glow: "rgba(198, 134, 66, 0.45)",
  },
  software: {
    label: "Software",
    rim: "#8a93a3",
    face: "linear-gradient(145deg, #f7f8fb 0%, #c5ccd8 48%, #7f8898 100%)",
    accent: "#ffffff",
    glow: "rgba(140, 150, 170, 0.45)",
  },
  technique: {
    label: "Technique",
    rim: "#c9a227",
    face: "linear-gradient(145deg, #ffe9a0 0%, #e2b635 42%, #8a6a10 100%)",
    accent: "#fff8d6",
    glow: "rgba(226, 182, 53, 0.5)",
  },
  module: {
    label: "Module",
    rim: "#4f6d8c",
    face: "linear-gradient(145deg, #d7e7f8 0%, #7ea0c4 48%, #35557a 100%)",
    accent: "#eef6ff",
    glow: "rgba(79, 109, 140, 0.45)",
  },
};

function themeFor(kind: string) {
  return KIND_THEME[kind] ?? KIND_THEME.module;
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
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-40, 40], [12, -12]);
  const rotateY = useTransform(x, [-40, 40], [-14, 14]);
  const shine = useMotionTemplate`radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.65), transparent 42%)`;

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
            <div className="ho-medal-face ho-medal-face--front" style={{ ["--medal-glow" as string]: theme.glow }}>
              <motion.div className="ho-medal-shine" style={{ background: shine }} />
              <div className="ho-medal-sparks" aria-hidden>
                {Array.from({ length: 8 }).map((_, spark) => (
                  <span key={spark} style={{ ["--s" as string]: spark }} />
                ))}
              </div>
              <div
                className="ho-medal"
                style={{
                  ["--medal-rim" as string]: theme.rim,
                  ["--medal-face" as string]: theme.face,
                  ["--medal-accent" as string]: theme.accent,
                }}
              >
                <div className="ho-medal__ring" />
                <div className="ho-medal__core">
                  <span className="ho-medal__glyph" aria-hidden>
                    ★
                  </span>
                  <strong>Certified</strong>
                  <em>{theme.label}</em>
                </div>
              </div>
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
}: {
  code: string;
  moduleKind?: string;
  moduleTitle?: string;
}) {
  const theme = themeFor(moduleKind);
  return (
    <motion.div
      className="ho-medal-banner"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 14 }}
    >
      <div
        className="ho-medal ho-medal--banner"
        style={{
          ["--medal-rim" as string]: theme.rim,
          ["--medal-face" as string]: theme.face,
          ["--medal-accent" as string]: theme.accent,
          ["--medal-glow" as string]: theme.glow,
        }}
      >
        <div className="ho-medal__ring" />
        <div className="ho-medal__core">
          <span className="ho-medal__glyph" aria-hidden>
            ★
          </span>
          <strong>Certified</strong>
        </div>
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
