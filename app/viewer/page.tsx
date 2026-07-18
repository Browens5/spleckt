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
          <h1>Missing splat</h1>
          <p>Provide a content URL to open the SuperSplat viewer.</p>
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
          <p>Self-hosted PlayCanvas SuperSplat viewer</p>
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
