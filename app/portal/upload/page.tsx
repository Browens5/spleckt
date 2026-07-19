"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortalRole } from "@/components/portal/PortalRoleContext";
import { uploadFile } from "@/lib/upload-client";

type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function UploadPage() {
  const router = useRouter();
  const { canEdit, isAdmin } = usePortalRole();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    void fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUsers(data.users ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!canEdit) {
    return (
      <div className="portal-page">
        <div className="media-empty">
          <p>
            Your account is view-only. Ask an admin to promote you to editor if
            you need to upload or edit splats.
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a 3D capture file to upload.");
      setLoading(false);
      return;
    }

    try {
      const ownerId = String(form.get("ownerId") ?? "") || undefined;
      const uploaded = await uploadFile({
        file,
        purpose: "splat",
        ownerId: isAdmin ? ownerId : undefined,
      });
      let thumbnailKey: string | undefined;
      const thumb = form.get("thumbnail");
      if (thumb instanceof File && thumb.size > 0) {
        const thumbUpload = await uploadFile({
          file: thumb,
          purpose: "thumbnail",
          ownerId: isAdmin ? ownerId : undefined,
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
          ownerId: isAdmin ? ownerId : undefined,
        }),
      });

      if (!res.ok) {
<<<<<<< HEAD
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save splat metadata");
=======
        throw new Error("Could not save capture details");
>>>>>>> ffc6324 (Refresh site copy for 3D capture newcomers)
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
          <h1>Upload a 3D capture</h1>
          <p>
            Add a lifelike capture to your library. We accept .ply,
            .compressed.ply, .sog, and related 3D scene files.
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
        {isAdmin ? (
          <label>
            Assign to user
            <select name="ownerId" defaultValue="">
              <option value="">Me (admin)</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) — {user.role}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Capture file
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
        {isAdmin ? (
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input name="isFeatured" type="checkbox" />
            Feature on marketing landing page
          </label>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Uploading…" : "Upload capture"}
        </button>
      </form>
    </div>
  );
}
