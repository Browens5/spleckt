"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePortalRole } from "@/components/portal/PortalRoleContext";

type Splat = {
  id: string;
  title: string;
  fileUrl: string;
};

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const { canEdit } = usePortalRole();
  const [splat, setSplat] = useState<Splat | null>(null);

  useEffect(() => {
    void fetch(`/api/splats/${params.id}`)
      .then((r) => r.json())
      .then((data) => setSplat(data.splat));
  }, [params.id]);

  if (!canEdit) {
    return (
      <div className="portal-page">
        <div className="media-empty">
          <p>The SuperSplat editor is available to editors and admins only.</p>
          <Link className="btn btn--primary" href={`/portal/splats/${params.id}`}>
            Back to viewer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="viewer-page"
      style={{ minHeight: "100vh", margin: "-2rem -1.5rem -3rem" }}
    >
      <div className="viewer-page__bar">
        <div>
          <h1>{splat?.title ?? "SuperSplat Editor"}</h1>
          <p>
            Self-hosted PlayCanvas SuperSplat editor. Use File → Open to load the
            splat, or drag the file into the editor.
          </p>
        </div>
        <div className="splat-card__actions">
          {splat ? (
            <a className="btn btn--ghost" href={splat.fileUrl} download>
              Download splat
            </a>
          ) : null}
          <Link className="btn btn--primary" href={`/portal/splats/${params.id}`}>
            Back to viewer
          </Link>
        </div>
      </div>
      <iframe
        className="editor-frame"
        title="SuperSplat Editor"
        src="/editor/index.html"
        allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; clipboard-read; clipboard-write"
      />
    </div>
  );
}
