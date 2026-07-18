export async function uploadFile(params: {
  file: File;
  purpose: "splat" | "thumbnail" | "media" | "media-poster";
  ownerId?: string;
}) {
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: params.file.name,
      contentType: params.file.type || "application/octet-stream",
      purpose: params.purpose,
      ownerId: params.ownerId,
    }),
  });

  if (!presignRes.ok) {
    throw new Error("Could not start upload");
  }

  const presign = (await presignRes.json()) as {
    key: string;
    uploadUrl: string;
    mode: "local" | "r2";
    publicUrl: string;
  };

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": params.file.type || "application/octet-stream",
    },
    body: params.file,
  });

  if (!putRes.ok) {
    throw new Error("Upload failed");
  }

  return {
    key: presign.key,
    publicUrl: presign.publicUrl,
  };
}
