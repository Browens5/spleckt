export function supportsFileSystemAccess() {
  return (
    typeof window !== "undefined" &&
    typeof window.showOpenFilePicker === "function" &&
    typeof window.showDirectoryPicker === "function"
  );
}

const INPUT_ACCEPT =
  "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,application/zip,.zip,image/jpeg,image/png,image/webp";

/** Pick an equirectangular video or a ZIP of individual photos/frames. */
export async function pickInputSource(): Promise<{
  file: File;
  pathLabel: string;
  handle: FileSystemFileHandle | null;
}> {
  if (supportsFileSystemAccess() && window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      excludeAcceptAllOption: false,
      types: [
        {
          description: "Equirectangular video or ZIP of frames",
          accept: {
            "video/mp4": [".mp4"],
            "video/webm": [".webm"],
            "video/quicktime": [".mov"],
            "video/*": [".mp4", ".webm", ".mov", ".m4v"],
            "application/zip": [".zip"],
            "application/x-zip-compressed": [".zip"],
          },
        },
      ],
    });
    const file = await handle.getFile();
    return { file, pathLabel: handle.name, handle };
  }

  const file = await pickFileWithInput(INPUT_ACCEPT);
  return { file, pathLabel: file.name, handle: null };
}

/** @deprecated Use pickInputSource — kept as an alias for clarity at call sites. */
export const pickInputVideo = pickInputSource;

export async function pickOutputDirectory(): Promise<{
  handle: FileSystemDirectoryHandle | null;
  pathLabel: string;
}> {
  if (supportsFileSystemAccess() && window.showDirectoryPicker) {
    const handle = await window.showDirectoryPicker({
      mode: "readwrite",
      id: "cubemap-output",
    });
    const permission = await ensureReadWrite(handle);
    if (permission !== "granted") {
      throw new Error("Write permission for the output folder was denied.");
    }
    return { handle, pathLabel: handle.name };
  }

  return {
    handle: null,
    pathLabel: "Browser downloads (fallback)",
  };
}

async function ensureReadWrite(handle: FileSystemDirectoryHandle) {
  const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" };
  if ((await handle.queryPermission(opts)) === "granted") return "granted";
  if ((await handle.requestPermission(opts)) === "granted") return "granted";
  return "denied";
}

function pickFileWithInput(accept: string) {
  return new Promise<File>((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";
    const cleanup = () => {
      input.remove();
    };
    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0];
        cleanup();
        if (!file) {
          reject(new Error("No file selected."));
          return;
        }
        resolve(file);
      },
      { once: true },
    );
    input.addEventListener(
      "cancel",
      () => {
        cleanup();
        reject(new DOMException("The user aborted a request.", "AbortError"));
      },
      { once: true },
    );
    document.body.appendChild(input);
    input.click();
  });
}

export async function writeBlobToDirectory(
  dir: FileSystemDirectoryHandle,
  relativePath: string,
  blob: Blob,
) {
  const parts = relativePath.split("/").filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) throw new Error("Invalid output path.");

  let current = dir;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }

  const fileHandle = await current.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return fileHandle;
}

/**
 * Stream a fetch Response into a local folder (File System Access API).
 * Avoids holding the entire YouTube download in memory when possible.
 */
export async function writeResponseToDirectory(
  dir: FileSystemDirectoryHandle,
  fileName: string,
  response: Response,
  onProgress?: (receivedBytes: number, totalBytes: number | null) => void,
): Promise<FileSystemFileHandle> {
  const safeName = fileName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim() || "youtube.mp4";
  const fileHandle = await dir.getFileHandle(safeName, { create: true });
  const writable = await fileHandle.createWritable();

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    await writable.write(buffer);
    await writable.close();
    onProgress?.(buffer.byteLength, buffer.byteLength);
    return fileHandle;
  }

  const totalHeader = response.headers.get("content-length");
  const totalBytes = totalHeader ? Number(totalHeader) : null;
  const reader = response.body.getReader();
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        await writable.write(value);
        received += value.byteLength;
        onProgress?.(received, Number.isFinite(totalBytes) ? totalBytes : null);
      }
    }
  } finally {
    await writable.close();
  }

  return fileHandle;
}

/**
 * Pick a folder for saving a YouTube download locally before Cubemap processing.
 */
export async function pickYoutubeDownloadDirectory(): Promise<{
  handle: FileSystemDirectoryHandle | null;
  pathLabel: string;
}> {
  if (supportsFileSystemAccess() && window.showDirectoryPicker) {
    const handle = await window.showDirectoryPicker({
      mode: "readwrite",
      id: "cubemap-youtube-download",
    });
    const permission = await ensureReadWrite(handle);
    if (permission !== "granted") {
      throw new Error("Write permission for the download folder was denied.");
    }
    return { handle, pathLabel: handle.name };
  }

  return {
    handle: null,
    pathLabel: "Browser downloads (fallback)",
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
