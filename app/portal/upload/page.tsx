"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/upload-client";

export default function UploadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a splat file to upload.");
      setLoading(false);
      return;
    }

    try {
      const uploaded = await uploadFile({ file, purpose: "splat" });
      let thumbnailKey: string | undefined;
      const thumb = form.get("thumbnail");
      if (thumb instanceof File && thumb.size > 0) {
        const thumbUpload = await uploadFile({
          file: thumb,
          purpose: "thumbnail",
        });
        thumbnailKey = thumbUpload.key;
      }

      const res = await fetch("/api/splats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          category: String(form.get("category") ?? "other"),
          fileKey: uploaded.key,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
          thumbnailKey,
          isFeatured: form.get("isFeatured") === "on",
        }),
      });

      if (!res.ok) {
        throw new Error("Could not save splat metadata");
      }

      const data = await res.json();
      router.push(`/portal/splats/${data.splat.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setLoading(false);
    }
  }

  return (
    <div className="portal-page">
      <div className="portal-page__header">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Upload a splat</h1>
          <p>
            Accepts `.ply`, `.compressed.ply`, `.sog`, and related SuperSplat
            scene files. Large files go to Cloudflare R2 when configured.
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
          Category
          <select name="category" defaultValue="real-estate">
            <option value="real-estate">Real estate</option>
            <option value="construction">Construction</option>
            <option value="business">Business</option>
            <option value="home">Home</option>
            <option value="scene">Scene</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Splat file
          <input
            name="file"
            type="file"
            required
            accept=".ply,.sog,.json,.compressed.ply"
          />
        </label>
        <label>
          Thumbnail (optional)
          <input name="thumbnail" type="file" accept="image/*" />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input name="isFeatured" type="checkbox" />
          Feature on marketing landing page (admin)
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Uploading…" : "Upload splat"}
        </button>
      </form>
    </div>
  );
}
