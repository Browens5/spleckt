"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SplatViewerFrame } from "@/components/viewer/SplatViewerFrame";

type SharedSplat = {
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl: string | null;
};

export default function SharedSplatPage() {
  const params = useParams<{ hash: string }>();
  const [splat, setSplat] = useState<SharedSplat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/share/${params.hash}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setSplat(data.splat))
      .catch(() => setError("This share link is invalid or no longer available."));
  }, [params.hash]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Link unavailable</h1>
          <p>{error}</p>
          <Link href="/" className="btn btn--primary">
            Visit Spleckt
          </Link>
        </div>
      </div>
    );
  }

  if (!splat) {
    return <div className="viewer-page" />;
  }

  return (
    <div className="viewer-page">
      <div className="viewer-page__bar">
        <div>
          <h1>{splat.title}</h1>
          <p>{splat.description || "Shared with Spleckt"}</p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Spleckt
        </Link>
      </div>
      <SplatViewerFrame
        contentUrl={splat.fileUrl}
        posterUrl={splat.thumbnailUrl}
        title={splat.title}
      />
    </div>
  );
}
