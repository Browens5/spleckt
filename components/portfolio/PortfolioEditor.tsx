"use client";

import { FormEvent, useMemo, useState } from "react";
import { uploadFile } from "@/lib/upload-client";
import type { PortfolioProfile, PortfolioProject } from "@/lib/portfolio/types";

type EditorProps = {
  open: boolean;
  profile: PortfolioProfile;
  projects: PortfolioProject[];
  selectedId: string | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onSelectProject: (id: string) => void;
};

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

  if (!open) return null;

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
          <ul className="portfolio-editor__list">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className={project.id === selected?.id ? "is-active" : undefined}
                  onClick={() => onSelectProject(project.id)}
                >
                  <strong>{project.title}</strong>
                  <span>
                    {project.category}
                    {project.year ? ` · ${project.year}` : ""}
                    {project.isPublished ? "" : " · draft"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

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
              <input name="image" type="file" accept="image/*" />
            </label>
            {selected?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="portfolio-editor__preview"
                src={selected.imageUrl}
                alt=""
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
