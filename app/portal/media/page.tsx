"use client";

import { FormEvent, useEffect, useState } from "react";
import { uploadFile } from "@/lib/upload-client";

type MediaItem = {
  id: string;
  title: string;
  description: string;
  kind: string;
  fileUrl: string;
  posterUrl: string | null;
  isPublished: boolean;
};

export default function MediaAdminPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const res = await fetch("/api/media");
      if (cancelled) return;
      if (!res.ok) {
        setError("Admin access required to manage marketing media.");
        return;
      }
      const data = await res.json();
      setMedia(data.media ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    const res = await fetch("/api/media");
    if (!res.ok) {
      setError("Admin access required to manage marketing media.");
      return;
    }
    const data = await res.json();
    setMedia(data.media ?? []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a media file.");
      setLoading(false);
      return;
    }

    try {
      const uploaded = await uploadFile({ file, purpose: "media" });
      let posterKey: string | undefined;
      const poster = form.get("poster");
      if (poster instanceof File && poster.size > 0) {
        posterKey = (
          await uploadFile({ file: poster, purpose: "media-poster" })
        ).key;
      }

      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          kind: String(form.get("kind") ?? "video"),
          fileKey: uploaded.key,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
          posterKey,
          isPublished: true,
        }),
      });

      if (!res.ok) throw new Error("Could not save media");
      event.currentTarget.reset();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="portal-page">
      <div className="portal-page__header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Marketing media</h1>
          <p>
            Upload process videos and stills. Published items appear on the
            landing page automatically.
          </p>
        </div>
      </div>

      <form className="portal-form" onSubmit={onSubmit}>
        <label>
          Title
          <input name="title" required />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <label>
          Kind
          <select name="kind" defaultValue="video">
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="splat">3D capture example</option>
          </select>
        </label>
        <label>
          Media file
          <input name="file" type="file" required />
        </label>
        <label>
          Poster / thumbnail (optional)
          <input name="poster" type="file" accept="image/*" />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Uploading…" : "Publish media"}
        </button>
      </form>

      <div className="splat-grid" style={{ marginTop: "2rem" }}>
        {media.map((item) => (
          <article key={item.id} className="splat-card">
            <div
              className="splat-card__thumb"
              style={
                item.posterUrl
                  ? { backgroundImage: `url(${item.posterUrl})` }
                  : undefined
              }
            />
            <div>
              <span className="pill">
                {item.kind === "splat" ? "3D capture" : item.kind}
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => void remove(item.id)}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
