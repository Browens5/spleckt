"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { wrapIndex } from "@/lib/portfolio/carousel";
import { DEFAULT_LINKEDIN_URL, DEFAULT_PROFILE } from "@/lib/portfolio/defaults";
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
  const [expanded, setExpanded] = useState(false);
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

  const browse = useCallback((index: number) => {
    setSelectedIndex(index);
    setExpanded(false);
    setSection("portfolio");
  }, []);

  const inspect = useCallback(
    (index: number, mode: "toggle" | "open" = "toggle") => {
      setSection("portfolio");
      if (mode === "open") {
        setSelectedIndex(index);
        setExpanded(true);
        return;
      }
      if (index === selectedIndex && expanded) {
        setExpanded(false);
        return;
      }
      setSelectedIndex(index);
      setExpanded(true);
    },
    [expanded, selectedIndex],
  );

  const go = useCallback(
    (delta: number) => {
      if (projects.length === 0) return;
      browse(wrapIndex(selectedIndex + delta, projects.length));
    },
    [browse, projects.length, selectedIndex],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") go(-1);
      if (event.key === "ArrowRight" || event.key === "ArrowDown") go(1);
      if (event.key === "Escape") {
        setExpanded(false);
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
    <div
      className={
        expanded && section === "portfolio"
          ? "portfolio-experience is-card-expanded"
          : "portfolio-experience"
      }
    >
      <div className="portfolio-stage" aria-hidden>
        <PortfolioCanvas
          projects={projects}
          selectedIndex={activeIndex}
          expanded={expanded && section === "portfolio"}
          interactive={section === "portfolio" && !editorOpen}
          onSelect={browse}
          onInspect={inspect}
          onActivate={activate}
          onCollapse={() => setExpanded(false)}
        />
        <div className="portfolio-vignette" />
        <div className="portfolio-neon" />
        <div className="portfolio-scan" />
        <div className="portfolio-frame" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>

      <header className="portfolio-chrome">
        <p className="portfolio-name">{profile.name}</p>
        <div className="portfolio-title">
          <span />
          <h1>PORTFOLIO</h1>
          <span />
        </div>
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
          <button
            type="button"
            className="portfolio-panel__close"
            aria-label="Back to portfolio"
            onClick={() => setSection("portfolio")}
          >
            ×
          </button>
          <p>{panel.kicker}</p>
          <h2>{panel.title}</h2>
          <div className="portfolio-panel__copy" data-portfolio-scroll>
            <p>{panel.body}</p>
          </div>
          {section === "contact" ? (
            <div className="portfolio-panel__actions">
              {profile.contactEmail ? (
                <a className="portfolio-btn" href={`mailto:${profile.contactEmail}`}>
                  Send a message
                </a>
              ) : null}
              <a
                className="portfolio-btn"
                href={DEFAULT_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      {section === "portfolio" && selected && !expanded ? (
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

      {section === "portfolio" && selected && expanded ? (
        <article
          className="portfolio-focus-card"
          data-portfolio-scroll
          onClick={() => inspect(activeIndex)}
        >
          <p>{String(activeIndex + 1).padStart(2, "0")}</p>
          {selected.imageUrl ? (
            <div className="portfolio-focus-card__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.imageUrl} alt="" />
            </div>
          ) : null}
          <h2>{selected.title}</h2>
          <span>
            {selected.category}
            {selected.year ? ` · ${selected.year}` : ""}
          </span>
          <div className="portfolio-focus-card__copy">
            <p>{selected.description}</p>
          </div>
          {selected.linkUrl ? (
            <button
              type="button"
              className="portfolio-focus-card__play"
              aria-label={`Open ${selected.title}`}
              onClick={(event) => {
                event.stopPropagation();
                activate(activeIndex);
              }}
            >
              ▶
            </button>
          ) : null}
        </article>
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
            onClick={() => {
              setSection(item.id);
              if (item.id !== "portfolio") setExpanded(false);
            }}
          >
            <span aria-hidden>{iconFor(item.id)}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {canEdit ? (
        <div className="portfolio-tools">
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
          <button
            type="button"
            className="portfolio-btn portfolio-btn--ghost"
            onClick={() => void authClient.signOut().then(() => void load())}
          >
            Sign out
          </button>
        </div>
      ) : null}

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
