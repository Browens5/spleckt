"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { wrapIndex } from "@/lib/portfolio/carousel";
import { DEFAULT_PROFILE } from "@/lib/portfolio/defaults";
import type {
  PortfolioProfile,
  PortfolioProject,
  PortfolioSection,
} from "@/lib/portfolio/types";
import { PortfolioEditor } from "./PortfolioEditor";

const PortfolioCanvas = dynamic(
  () => import("./PortfolioCanvas").then((mod) => mod.PortfolioCanvas),
  {
    ssr: false,
    loading: () => <div className="portfolio-canvas-fallback" aria-hidden />,
  },
);

const SECTIONS: Array<{ id: PortfolioSection; label: string }> = [
  { id: "about", label: "About" },
  { id: "portfolio", label: "Portfolio" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export function PortfolioExperience() {
  const [canEdit, setCanEdit] = useState(false);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [profile, setProfile] = useState<PortfolioProfile>({
    ...DEFAULT_PROFILE,
    updatedAt: null,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [section, setSection] = useState<PortfolioSection>("portfolio");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/portfolio?all=1");
    if (!res.ok) return;
    const data = await res.json();
    setCanEdit(Boolean(data.canEdit));
    setProjects(data.projects ?? []);
    if (data.profile) setProfile(data.profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/portfolio?all=1");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (cancelled) return;
      setCanEdit(Boolean(data.canEdit));
      setProjects(data.projects ?? []);
      if (data.profile) setProfile(data.profile);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected =
    projects.length === 0
      ? null
      : (projects[Math.min(selectedIndex, projects.length - 1)] ?? null);
  const activeIndex =
    projects.length === 0 ? 0 : Math.min(selectedIndex, projects.length - 1);

  const go = useCallback(
    (delta: number) => {
      if (projects.length === 0) return;
      setSelectedIndex((current) => wrapIndex(current + delta, projects.length));
      setSection("portfolio");
    },
    [projects.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "Escape") {
        setSection("portfolio");
        setEditorOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const activate = (index: number) => {
    const project = projects[index];
    if (project?.linkUrl) {
      window.open(project.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  const selectById = (id: string) => {
    if (!id) {
      setEditingId(null);
      return;
    }
    setEditingId(id);
    const index = projects.findIndex((project) => project.id === id);
    if (index >= 0) setSelectedIndex(index);
  };

  const panel = useMemo(() => {
    if (section === "about") {
      return {
        kicker: "About",
        title: profile.name,
        body: profile.about,
      };
    }
    if (section === "skills") {
      return {
        kicker: "Skills",
        title: "Capabilities",
        body: profile.skills.join(" · ") || "Add skills in the editor.",
      };
    }
    if (section === "contact") {
      return {
        kicker: "Contact",
        title: profile.contactEmail || "Get in touch",
        body: profile.contactNote,
      };
    }
    return null;
  }, [profile, section]);

  return (
    <div className="portfolio-experience">
      <div className="portfolio-stage" aria-hidden>
        <PortfolioCanvas
          projects={projects}
          selectedIndex={activeIndex}
          interactive={section === "portfolio" && !editorOpen}
          onSelect={setSelectedIndex}
          onActivate={activate}
        />
        <div className="portfolio-vignette" />
        <div className="portfolio-scan" />
      </div>

      <header className="portfolio-chrome">
        <div className="portfolio-title">
          <span />
          <h1>PORTFOLIO</h1>
          <span />
        </div>
        <p className="portfolio-tagline">{profile.tagline}</p>
      </header>

      <button
        type="button"
        className="portfolio-chevron portfolio-chevron--left"
        aria-label="Previous project"
        onClick={() => go(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="portfolio-chevron portfolio-chevron--right"
        aria-label="Next project"
        onClick={() => go(1)}
      >
        ›
      </button>

      {panel ? (
        <section className="portfolio-panel" aria-live="polite">
          <p>{panel.kicker}</p>
          <h2>{panel.title}</h2>
          <p>{panel.body}</p>
          {section === "contact" && profile.contactEmail ? (
            <a className="portfolio-btn" href={`mailto:${profile.contactEmail}`}>
              Send a message
            </a>
          ) : null}
        </section>
      ) : null}

      {section === "portfolio" && selected ? (
        <div className="portfolio-caption">
          <p>{String(activeIndex + 1).padStart(2, "0")}</p>
          <div>
            <strong>{selected.title}</strong>
            <span>
              {selected.category}
              {selected.year ? ` · ${selected.year}` : ""}
            </span>
          </div>
        </div>
      ) : null}

      {loading ? <p className="portfolio-status">Initializing deck…</p> : null}
      {!loading && projects.length === 0 ? (
        <p className="portfolio-status">
          {canEdit
            ? "No project cards yet. Open the editor to add your first one."
            : "Projects are being prepared."}
        </p>
      ) : null}

      <nav className="portfolio-dock" aria-label="Portfolio sections">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={section === item.id ? "is-active" : undefined}
            onClick={() => setSection(item.id)}
          >
            <span aria-hidden>{iconFor(item.id)}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="portfolio-tools">
        {canEdit ? (
          <button
            type="button"
            className="portfolio-btn"
            onClick={() => {
              setEditorOpen((open) => !open);
              setEditingId(selected?.id ?? null);
            }}
          >
            {editorOpen ? "Close editor" : "Edit cards"}
          </button>
        ) : (
          <Link className="portfolio-btn portfolio-btn--ghost" href="/login">
            Sign in to edit
          </Link>
        )}
        {canEdit ? (
          <button
            type="button"
            className="portfolio-btn portfolio-btn--ghost"
            onClick={() => void authClient.signOut().then(() => void load())}
          >
            Sign out
          </button>
        ) : null}
      </div>

      {canEdit ? (
        <PortfolioEditor
          open={editorOpen}
          profile={profile}
          projects={projects}
          selectedId={editingId}
          onClose={() => setEditorOpen(false)}
          onSaved={load}
          onSelectProject={selectById}
        />
      ) : null}
    </div>
  );
}

function iconFor(section: PortfolioSection) {
  if (section === "about") return "◎";
  if (section === "skills") return "⬡";
  if (section === "contact") return "✉";
  return "◉";
}
