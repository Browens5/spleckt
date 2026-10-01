"use client";

import { DragEvent, FormEvent, useMemo, useRef, useState } from "react";
import { uploadFile } from "@/lib/upload-client";
import {
  DEFAULT_IMAGE_FRAME,
  type ImageFrame,
  clampFrame,
} from "@/lib/portfolio/imageFrame";
import type { PortfolioProfile, PortfolioProject } from "@/lib/portfolio/types";
import { ImageFramer } from "./ImageFramer";

type EditorProps = {
  open: boolean;
  profile: PortfolioProfile;
  projects: PortfolioProject[];
  selectedId: string | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onSelectProject: (id: string) => void;
};

function moveCard(order: string[], dragId: string, overId: string, placeAfter: boolean) {
  const from = order.indexOf(dragId);
  let to = order.indexOf(overId);
  if (from < 0 || to < 0 || dragId === overId) return order;
  if (from < to && !placeAfter) to -= 1;
  if (from > to && placeAfter) to += 1;
  if (from === to) return order;
  const next = order.slice();
  next.splice(from, 1);
  next.splice(to, 0, dragId);
  return next;
}

const emptyForm = {
  title: "",
  category: "",
  year: String(new Date().getFullYear()),
  description: "",
  linkUrl: "",
  isPublished: true,
};

export function PortfolioEditor({
  open,
  profile,
  projects,
  selectedId,
  onClose,
  onSaved,
  onSelectProject,
}: EditorProps) {
  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId],
  );
  const [tab, setTab] = useState<"projects" | "profile">("projects");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState(() => profileToDraft(profile));
  const projectKey = projects.map((project) => project.id).join("\n");
  const [orderKey, setOrderKey] = useState(projectKey);
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
  if (orderKey !== projectKey) {
    setOrderKey(projectKey);
    setOrderOverride(null);
  }
  const order = useMemo(
    () => orderOverride ?? (projectKey ? projectKey.split("\n") : []),
    [orderOverride, projectKey],
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const frameCardId = selected?.id ?? null;
  const [frameOwner, setFrameOwner] = useState<string | null>(frameCardId);
  const [frame, setFrame] = useState<ImageFrame>(() => frameFromProject(selected));
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);
  if (frameOwner !== frameCardId) {
    setFrameOwner(frameCardId);
    setFrame(frameFromProject(selected));
    setPickedUrl(null);
  }
  const orderRef = useRef(order);
  const dragIdRef = useRef<string | null>(null);
  const commitLock = useRef(false);

  const orderedProjects = useMemo(() => {
    const byId = new Map(projects.map((project) => [project.id, project]));
    return order
      .map((id) => byId.get(id))
      .filter((project): project is PortfolioProject => Boolean(project));
  }, [order, projects]);

  if (!open) return null;

  function onDragStart(event: DragEvent<HTMLButtonElement>, id: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    dragIdRef.current = id;
    orderRef.current = order;
    setDragId(id);
  }

  function onDragOver(event: DragEvent<HTMLButtonElement>, overId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const active = dragIdRef.current;
    if (!active || active === overId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const placeAfter = event.clientY > rect.top + rect.height / 2;
    setOrderOverride((current) => {
      const base = current ?? (projectKey ? projectKey.split("\n") : []);
      const next = moveCard(base, active, overId, placeAfter);
      orderRef.current = next;
      return next;
    });
  }

  async function commitOrder() {
    dragIdRef.current = null;
    setDragId(null);
    const next = orderRef.current;
    const previous = projectKey ? projectKey.split("\n") : [];
    if (next.join("\n") === previous.join("\n") || commitLock.current) return;
    commitLock.current = true;
    setSaving(true);
    setError(null);
    try {
      const results = await Promise.all(
        next.map((id, index) =>
          fetch(`/api/portfolio/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: index }),
          }),
        ),
      );
      if (results.some((res) => !res.ok)) {
        throw new Error("Could not save card order");
      }
      await onSaved();
    } catch (err) {
      setOrderOverride(null);
      setError(err instanceof Error ? err.message : "Could not save card order");
    } finally {
      commitLock.current = false;
      setSaving(false);
    }
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const file = form.get("image");
    try {
      let imageKey: string | undefined;
      let imageName: string | undefined;
      let contentType: string | undefined;
      if (file instanceof File && file.size > 0) {
        const uploaded = await uploadFile({ file, purpose: "portfolio" });
        imageKey = uploaded.key;
        imageName = file.name;
        contentType = file.type || "image/jpeg";
      }

      const payload = {
        title: String(form.get("title") ?? ""),
        category: String(form.get("category") ?? ""),
        year: String(form.get("year") ?? ""),
        description: String(form.get("description") ?? ""),
        linkUrl: String(form.get("linkUrl") ?? "") || null,
        isPublished: form.get("isPublished") === "on",
        imageFit: frame.fit,
        imageZoom: frame.zoom,
        imageX: frame.x,
        imageY: frame.y,
        ...(imageKey
          ? { imageKey, imageName, contentType }
          : {}),
      };

      const editingId = selected?.id;
      const res = await fetch(
        editingId ? `/api/portfolio/${editingId}` : "/api/portfolio",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not save project",
        );
      }
      const data = await res.json();
      if (!editingId) formEl.reset();
      await onSaved();
      if (data.project?.id) onSelectProject(data.project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id: string) {
    if (!window.confirm("Remove this project card?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete project");
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileDraft,
          skills: profileDraft.skills,
        }),
      });
      if (!res.ok) throw new Error("Could not save profile");
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="portfolio-editor" aria-label="Portfolio editor">
      <header className="portfolio-editor__head">
        <p>EDITOR</p>
        <h2>Project cards</h2>
        <button type="button" className="portfolio-icon-btn" onClick={onClose}>
          Close
        </button>
      </header>

      <div className="portfolio-editor__tabs">
        <button
          type="button"
          className={tab === "projects" ? "is-active" : undefined}
          onClick={() => setTab("projects")}
        >
          Projects
        </button>
        <button
          type="button"
          className={tab === "profile" ? "is-active" : undefined}
          onClick={() => {
            setProfileDraft(profileToDraft(profile));
            setTab("profile");
          }}
        >
          Profile
        </button>
      </div>

      {error ? <p className="portfolio-editor__error">{error}</p> : null}

      {tab === "projects" ? (
        <>
          <ul className="portfolio-editor__list" data-portfolio-scroll>
            {orderedProjects.map((project) => (
              <li
                key={project.id}
                className={dragId === project.id ? "is-dragging" : undefined}
              >
                <button
                  type="button"
                  draggable={!saving}
                  className={project.id === selected?.id ? "is-active" : undefined}
                  aria-grabbed={dragId === project.id}
                  onClick={() => onSelectProject(project.id)}
                  onDragStart={(event) => onDragStart(event, project.id)}
                  onDragOver={(event) => onDragOver(event, project.id)}
                  onDrop={(event) => event.preventDefault()}
                  onDragEnd={() => void commitOrder()}
                >
                  <span className="portfolio-editor__grip" aria-hidden>
                    ⋮⋮
                  </span>
                  <span>
                    <strong>{project.title}</strong>
                    <span>
                      {project.category}
                      {project.year ? ` · ${project.year}` : ""}
                      {project.isPublished ? "" : " · draft"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="portfolio-editor__hint">Drag a card up or down to change its order.</p>

          <form className="portfolio-editor__form" onSubmit={saveProject} key={selected?.id ?? "new"}>
            <p className="portfolio-editor__label">
              {selected ? "Edit selected card" : "Add a new card"}
            </p>
            <label>
              Title
              <input name="title" required defaultValue={selected?.title ?? emptyForm.title} />
            </label>
            <label>
              Category
              <input
                name="category"
                defaultValue={selected?.category ?? emptyForm.category}
                placeholder="Cinematic"
              />
            </label>
            <label>
              Year
              <input name="year" defaultValue={selected?.year ?? emptyForm.year} />
            </label>
            <label>
              Description
              <textarea
                name="description"
                rows={4}
                defaultValue={selected?.description ?? emptyForm.description}
              />
            </label>
            <label>
              Project link (optional)
              <input
                name="linkUrl"
                type="url"
                defaultValue={selected?.linkUrl ?? emptyForm.linkUrl}
                placeholder="https://"
              />
            </label>
            <label>
              Card image
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  setPickedUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return url;
                  });
                  setFrame(DEFAULT_IMAGE_FRAME);
                }}
              />
            </label>
            {pickedUrl || selected?.imageUrl ? (
              <ImageFramer
                src={pickedUrl || selected?.imageUrl || ""}
                frame={frame}
                onChange={setFrame}
              />
            ) : null}
            <label className="portfolio-editor__check">
              <input
                name="isPublished"
                type="checkbox"
                defaultChecked={selected?.isPublished ?? emptyForm.isPublished}
              />
              Published on the carousel
            </label>
            <div className="portfolio-editor__actions">
              <button className="portfolio-btn" type="submit" disabled={saving}>
                {saving ? "Saving…" : selected ? "Update card" : "Add card"}
              </button>
              {selected ? (
                <button
                  className="portfolio-btn portfolio-btn--ghost"
                  type="button"
                  onClick={() => onSelectProject("")}
                >
                  New card
                </button>
              ) : null}
              {selected ? (
                <button
                  className="portfolio-btn portfolio-btn--danger"
                  type="button"
                  onClick={() => void removeProject(selected.id)}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </form>
        </>
      ) : (
        <form className="portfolio-editor__form" onSubmit={saveProfile}>
          <label>
            Display name
            <input
              value={profileDraft.name}
              onChange={(event) =>
                setProfileDraft((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Tagline
            <input
              value={profileDraft.tagline}
              onChange={(event) =>
                setProfileDraft((current) => ({
                  ...current,
                  tagline: event.target.value,
                }))
              }
            />
          </label>
          <label>
            About
            <textarea
              rows={6}
              value={profileDraft.about}
              onChange={(event) =>
                setProfileDraft((current) => ({ ...current, about: event.target.value }))
              }
            />
          </label>
          <label>
            Skills (one per line)
            <textarea
              rows={6}
              value={profileDraft.skills}
              onChange={(event) =>
                setProfileDraft((current) => ({
                  ...current,
                  skills: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Contact email
            <input
              type="email"
              value={profileDraft.contactEmail}
              onChange={(event) =>
                setProfileDraft((current) => ({
                  ...current,
                  contactEmail: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Contact note
            <textarea
              rows={3}
              value={profileDraft.contactNote}
              onChange={(event) =>
                setProfileDraft((current) => ({
                  ...current,
                  contactNote: event.target.value,
                }))
              }
            />
          </label>
          <button className="portfolio-btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      )}
    </aside>
  );
}

function frameFromProject(project: PortfolioProject | null): ImageFrame {
  if (!project) return DEFAULT_IMAGE_FRAME;
  return clampFrame({
    fit: project.imageFit,
    zoom: project.imageZoom,
    x: project.imageX,
    y: project.imageY,
  });
}

function profileToDraft(profile: PortfolioProfile) {
  return {
    name: profile.name,
    tagline: profile.tagline,
    about: profile.about,
    skills: profile.skills.join("\n"),
    contactEmail: profile.contactEmail,
    contactNote: profile.contactNote,
  };
}
