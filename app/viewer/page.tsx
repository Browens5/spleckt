"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SplatViewerFrame } from "@/components/viewer/SplatViewerFrame";

function ViewerInner() {
  const params = useSearchParams();
  const content = params.get("content");
  const title = params.get("title") ?? "Spleckt viewer";
  const poster = params.get("poster");
  const settings = params.get("settings") ?? undefined;

  if (!content) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>No capture to show</h1>
          <p>Add a capture link to open the interactive 3D viewer.</p>
          <Link href="/" className="btn btn--primary">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-page">
      <div className="viewer-page__bar">
        <div>
          <h1>{title}</h1>
          <p>Explore this lifelike 3D capture</p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Close
        </Link>
      </div>
      <SplatViewerFrame
        contentUrl={content}
        settingsUrl={settings}
        posterUrl={poster}
        title={title}
      />
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="viewer-page" />}>
      <ViewerInner />
    </Suspense>
  );
}
