const MAX_EDGE = 1920;
const TARGET_BYTES = 1.8 * 1024 * 1024;

function blobFromCanvas(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode the photo."));
      },
      "image/jpeg",
      quality,
    );
  });
}

/** Shrink a card photo so it can upload through the same-origin proxy. */
export async function prepareCardImage(file: File): Promise<File> {
  const looksLikeImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
  if (!looksLikeImage) {
    throw new Error("Choose a photo (JPEG, PNG, or WebP).");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (file.size <= 4 * 1024 * 1024) return file;
    throw new Error("Could not read that photo. Try a JPEG or PNG.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.84;
  let blob = await blobFromCanvas(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > 0.55) {
    quality -= 0.08;
    blob = await blobFromCanvas(canvas, quality);
  }

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
