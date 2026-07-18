"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SplatViewerFrame } from "@/components/viewer/SplatViewerFrame";

type Splat = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  isFeatured: boolean;
};

type ShareLink = {
  id: string;
  hash: string;
  url: string;
};

export default function SplatDetailPage() {
  const params = useParams<{ id: string }>();
  const [splat, setSplat] = useState<Splat | null>(null);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [splatRes, shareRes] = await Promise.all([
        fetch(`/api/splats/${params.id}`),
        fetch(`/api/splats/${params.id}/share`),
      ]);

      if (cancelled) return;

      if (!splatRes.ok) {
        setError("Splat not found");
        return;
      }

      const splatData = await splatRes.json();
      const shareData = await shareRes.json();
      setSplat(splatData.splat);
      setLinks(shareData.links ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function createShareLink() {
    const res = await fetch(`/api/splats/${params.id}/share`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setLinks((current) => [data.link, ...current]);
  }

  async function toggleFeatured() {
    if (!splat) return;
    const res = await fetch(`/api/splats/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !splat.isFeatured }),
    });
    if (res.ok) {
      const data = await res.json();
      setSplat(data.splat);
    }
  }

  async function copyLink(url: string) {
    const absolute = new URL(url, window.location.origin).toString();
    await navigator.clipboard.writeText(absolute);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (error) {
    return (
      <div className="portal-page">
        <p className="form-error">{error}</p>
      </div>
    );
  }

  if (!splat) {
    return (
      <div className="portal-page">
        <p>Loading splat…</p>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-page__header">
        <div>
          <p className="eyebrow">{splat.category.replace("-", " ")}</p>
          <h1>{splat.title}</h1>
          <p>{splat.description || "Interactive Gaussian Splat capture"}</p>
        </div>
        <div className="splat-card__actions">
          <Link className="btn btn--ghost" href={`/portal/editor/${splat.id}`}>
            Open editor
          </Link>
          <button type="button" className="btn btn--ghost" onClick={toggleFeatured}>
            {splat.isFeatured ? "Unfeature" : "Feature on landing"}
          </button>
          <button type="button" className="btn btn--primary" onClick={createShareLink}>
            Create share link
          </button>
        </div>
      </div>

      <div style={{ height: "58vh", borderRadius: 16, overflow: "hidden" }}>
        <SplatViewerFrame
          contentUrl={splat.fileUrl}
          posterUrl={splat.thumbnailUrl}
          title={splat.title}
        />
      </div>

      <div className="share-box">
        <strong>Public hashed links</strong>
        {links.length === 0 ? (
          <p>No share links yet. Create one to send a public viewer URL.</p>
        ) : (
          links.map((link) => (
            <div key={link.id} className="splat-card__actions">
              <code>{link.url}</code>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void copyLink(link.url)}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <Link className="btn btn--primary" href={link.url} target="_blank">
                Open
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
