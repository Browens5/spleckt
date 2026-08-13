import { zipSync } from "fflate";

export type FetchSogZipOptions = {
  metaUrl: string;
  /** Drop higher-order SH layers to shrink download / VRAM (mobile). */
  dropShN?: boolean;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

function collectReferencedFiles(
  meta: Record<string, unknown>,
  dropShN: boolean,
): string[] {
  const names = new Set<string>();
  for (const [key, value] of Object.entries(meta)) {
    if (dropShN && key === "shN") continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const files = (value as { files?: unknown }).files;
    if (!Array.isArray(files)) continue;
    for (const file of files) {
      if (typeof file === "string" && file.length > 0) names.add(file);
    }
  }
  return [...names];
}

/**
 * Spark's WASM loader accepts SOG as a zip (`.sog` / `pcsogszip`), not a bare
 * `meta.json` URL. Fetch the unbundled SuperSplat layout and pack it in-memory.
 */
export async function fetchSogAsZipBytes({
  metaUrl,
  dropShN = false,
  onProgress,
  signal,
}: FetchSogZipOptions): Promise<Uint8Array> {
  const metaRes = await fetch(metaUrl, { signal });
  if (!metaRes.ok) {
    throw new Error(`Failed to fetch SOG meta (${metaRes.status})`);
  }

  const metaText = await metaRes.text();
  const meta = JSON.parse(metaText) as Record<string, unknown>;
  if (dropShN && "shN" in meta) {
    delete meta.shN;
  }

  const baseUrl = metaUrl.replace(/[^/]+$/, "");
  const files = collectReferencedFiles(meta, dropShN);
  const total = files.length + 1;
  let completed = 1;
  onProgress?.(completed / total);

  const zipFiles: Record<string, Uint8Array> = {
    "meta.json": new TextEncoder().encode(JSON.stringify(meta)),
  };

  await Promise.all(
    files.map(async (name) => {
      const res = await fetch(`${baseUrl}${name}`, { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch SOG asset ${name} (${res.status})`);
      }
      zipFiles[name] = new Uint8Array(await res.arrayBuffer());
      completed += 1;
      onProgress?.(completed / total);
    }),
  );

  // Store-only: webps are already compressed.
  return zipSync(zipFiles, { level: 0 });
}
