export async function uploadFile(params: {
  file: File;
  purpose: "splat" | "thumbnail" | "media" | "media-poster" | "portfolio";
  ownerId?: string;
}) {
  const contentType = params.file.type || "application/octet-stream";

  let presignRes: Response;
  try {
    presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: params.file.name,
        contentType,
        purpose: params.purpose,
        ownerId: params.ownerId,
      }),
    });
  } catch {
    throw new Error(
      "Could not reach the upload API. Check your connection and try again.",
    );
  }

  if (!presignRes.ok) {
    const data = await presignRes.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `Could not start upload (${presignRes.status})`,
    );
  }

  const presign = (await presignRes.json()) as {
    key: string;
    uploadUrl: string;
    mode: "local" | "r2";
    publicUrl: string;
  };

  let putRes: Response;
  try {
    // For R2, avoid sending a Content-Type that wasn't part of the signature.
    putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      body: params.file,
      ...(presign.mode === "local"
        ? {
            headers: {
              "Content-Type": contentType,
            },
          }
        : {}),
    });
  } catch {
    throw new Error(
      presign.mode === "r2"
        ? "Upload to Cloudflare R2 failed (often missing bucket CORS). Open /api/health and check r2.corsOk, or set CORS on the R2 bucket for https://www.spleckt.com."
        : "Upload failed to reach the server.",
    );
  }

  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    throw new Error(
      `Upload failed (${putRes.status})${detail ? `: ${detail.slice(0, 180)}` : ""}`,
    );
  }

  return {
    key: presign.key,
    publicUrl: presign.publicUrl,
  };
}
