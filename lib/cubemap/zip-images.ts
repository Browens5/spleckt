import { unzipSync } from "fflate";

const IMAGE_EXT = /\.(jpe?g|png|webp|bmp|tiff?)$/i;

export function isZipFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"
  );
}

export function isVideoFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("video/") ||
    name.endsWith(".mp4") ||
    name.endsWith(".webm") ||
    name.endsWith(".mov") ||
    name.endsWith(".m4v")
  );
}

function basename(path: string) {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] ?? path;
}

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export type ZipImageEntry = {
  /** Path inside the archive. */
  path: string;
  /** File name only. */
  name: string;
  bytes: Uint8Array;
};

/**
 * Extract image frames from a ZIP of equirectangular photos/frames.
 * Entries are sorted by natural filename order; nested folders are allowed.
 */
export async function extractImagesFromZip(
  file: File,
  signal?: AbortSignal,
): Promise<ZipImageEntry[]> {
  if (signal?.aborted) {
    throw new DOMException("Cancelled", "AbortError");
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  if (signal?.aborted) {
    throw new DOMException("Cancelled", "AbortError");
  }

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(buffer);
  } catch {
    throw new Error("Unable to read ZIP archive. Make sure the file is a valid .zip.");
  }

  const entries: ZipImageEntry[] = [];
  for (const [path, bytes] of Object.entries(files)) {
    const name = basename(path);
    if (!name || name.startsWith(".")) continue;
    if (path.includes("__MACOSX/")) continue;
    if (!IMAGE_EXT.test(name)) continue;
    if (!bytes || bytes.length === 0) continue;
    entries.push({ path, name, bytes });
  }

  entries.sort((a, b) => naturalCompare(a.name, b.name) || naturalCompare(a.path, b.path));

  if (entries.length === 0) {
    throw new Error(
      "No images found in the ZIP. Include JPG, PNG, WebP, BMP, or TIFF frames.",
    );
  }

  return entries;
}

export function mimeForImageName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  return "image/jpeg";
}

export async function loadImageBitmapFromBytes(
  bytes: Uint8Array,
  name: string,
) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mimeForImageName(name) });

  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob);
    } catch {
      // Fall through to HTMLImageElement.
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Unable to decode image “${name}”.`));
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}
