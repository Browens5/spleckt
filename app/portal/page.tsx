"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePortalRole } from "@/components/portal/PortalRoleContext";

type Splat = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  isFeatured: boolean;
};

export default function PortalLibraryPage() {
  const { canEdit, role } = usePortalRole();
  const [splats, setSplats] = useState<Splat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/splats")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSplats(data.splats ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="portal-page">
      <div className="portal-page__header">
        <div>
          <p className="eyebrow">Your library</p>
          <h1>Hosted splats</h1>
          <p>
            {canEdit
              ? "Open, edit, and share captures with hashed public links."
              : "View-only access. Ask an admin if you need editor permissions."}
          </p>
        </div>
        {canEdit ? (
          <Link href="/portal/upload" className="btn btn--primary">
            Upload splat
          </Link>
        ) : (
          <span className="pill">{role}</span>
        )}
      </div>

      {loading ? <p>Loading library…</p> : null}

      {!loading && splats.length === 0 ? (
        <div className="media-empty">
          <p>
            {canEdit
              ? "No splats yet. Upload a `.ply`, `.compressed.ply`, or `.sog` file to get started."
              : "No splats assigned to you yet. An editor or admin can upload and assign captures to your account."}
          </p>
        </div>
      ) : null}

      <div className="splat-grid">
        {splats.map((splat) => (
          <article key={splat.id} className="splat-card">
            <div
              className="splat-card__thumb"
              style={
                splat.thumbnailUrl
                  ? { backgroundImage: `url(${splat.thumbnailUrl})` }
                  : undefined
              }
            />
            <div>
              {splat.isFeatured ? <span className="pill">Featured</span> : null}
              <h3>{splat.title}</h3>
              <p>{splat.description || splat.category}</p>
            </div>
            <div className="splat-card__actions">
              <Link
                className="btn btn--primary"
                href={`/portal/splats/${splat.id}`}
              >
                View
              </Link>
              {canEdit ? (
                <Link
                  className="btn btn--ghost"
                  href={`/portal/editor/${splat.id}`}
                >
                  Editor
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
