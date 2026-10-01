export type ImageFit = "cover" | "contain";

export type ImageFrame = {
  fit: ImageFit;
  zoom: number;
  x: number;
  y: number;
};

export const DEFAULT_IMAGE_FRAME: ImageFrame = {
  fit: "cover",
  zoom: 1,
  x: 0,
  y: 0,
};

/**
 * Photo area painted on a portfolio card, in texture pixels.
 * Width matches the inner card face. Height runs from the top inner edge
 * down to the title block.
 */
export const CARD_PHOTO = { width: 732, height: 708 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampFrame(frame?: Partial<ImageFrame> | null): ImageFrame {
  return {
    fit: frame?.fit === "contain" ? "contain" : "cover",
    zoom: clamp(Number(frame?.zoom) || 1, 1, 3),
    x: clamp(Number(frame?.x) || 0, -1, 1),
    y: clamp(Number(frame?.y) || 0, -1, 1),
  };
}

export function framedImageRect(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  frame: ImageFrame,
) {
  const safeWidth = Math.max(imageWidth, 1);
  const safeHeight = Math.max(imageHeight, 1);
  const base =
    frame.fit === "contain"
      ? Math.min(frameWidth / safeWidth, frameHeight / safeHeight)
      : Math.max(frameWidth / safeWidth, frameHeight / safeHeight);
  const scale = base * frame.zoom;
  const width = safeWidth * scale;
  const height = safeHeight * scale;
  const maxX = Math.max(0, width - frameWidth);
  const maxY = Math.max(0, height - frameHeight);
  return {
    x: (frameWidth - width) / 2 + frame.x * (maxX / 2),
    y: (frameHeight - height) / 2 + frame.y * (maxY / 2),
    width,
    height,
  };
}
