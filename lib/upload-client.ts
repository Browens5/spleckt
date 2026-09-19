const PROXY_MAX_BYTES = 4.2 * 1024 * 1024;

function corsHelp() {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.spleckt.com";
  return `Upload to Cloudflare R2 failed (often missing bucket CORS). Open /api/health and check r2.corsOk, or set CORS on the R2 bucket for ${origin} (and https://www.spleckt.com / https://portfolio.spleckt.com).`;
}

async function putViaProxy(key: string, file: File, contentType: string) {
  const putRes = await fetch(`/api/upload/local?key=${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!putRes.ok) {
    const data = await putRes.json().catch(() => ({}));
    const detail =
      typeof data.error === "string" ? data.error : (await putRes.text().catch(() => "")).slice(0, 180);
    throw new Error(
      putRes.status === 413
        ? `${corsHelp()} Large files need a direct R2 upload.`
        : `Upload failed (${putRes.status})${detail ? `: ${detail}` : ""}`,
    );
  }
}

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

  if (presign.mode === "local" || params.purpose === "portfolio") {
    await putViaProxy(presign.key, params.file, contentType);
    return {
      key: presign.key,
      publicUrl: presign.publicUrl,
    };
  }

  let putRes: Response;
  try {
    // For R2, avoid sending a Content-Type that wasn't part of the signature.
    putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      body: params.file,
    });
  } catch {
    if (params.file.size <= PROXY_MAX_BYTES) {
      await putViaProxy(presign.key, params.file, contentType);
      return {
        key: presign.key,
        publicUrl: presign.publicUrl,
      };
    }
    throw new Error(corsHelp());
  }

  if (!putRes.ok) {
    if (params.file.size <= PROXY_MAX_BYTES) {
      await putViaProxy(presign.key, params.file, contentType);
      return {
        key: presign.key,
        publicUrl: presign.publicUrl,
      };
    }
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
