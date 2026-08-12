import type { MaskClass } from "@/lib/cubemap/types";

type TransformersModule = typeof import("@huggingface/transformers");

type SegmenterBundle = {
  model: {
    (inputs: unknown): Promise<{ logits: unknown }>;
    config: { id2label?: Record<string, string> };
  };
  processor: {
    (images: unknown): Promise<unknown>;
    image_processor: {
      post_process_semantic_segmentation: (
        outputs: unknown,
        targetSizes: number[][],
      ) => Array<{
        segmentation: { data: ArrayLike<number>; dims: number[] };
        labels: number[];
      }>;
    };
  };
  RawImage: TransformersModule["RawImage"];
};

const MODEL_ID = "Xenova/segformer-b0-finetuned-ade-512-512";

/** ADE20K labels selected by each mask-class toggle (plus close vehicle siblings). */
const LABEL_GROUPS: Record<MaskClass, string[]> = {
  people: ["person"],
  cars: ["car", "bus", "truck", "van", "minibike", "bicycle"],
  sky: ["sky"],
};

let transformersPromise: Promise<TransformersModule> | null = null;
let segmenterPromise: Promise<SegmenterBundle> | null = null;

async function loadTransformers() {
  if (!transformersPromise) {
    transformersPromise = import("@huggingface/transformers");
  }
  return transformersPromise;
}

export async function ensureMaskSegmenter(
  onStatus?: (message: string) => void,
) {
  if (!segmenterPromise) {
    onStatus?.("Downloading on-device segmentation model (first use only)…");
    segmenterPromise = (async () => {
      const {
        AutoModelForSemanticSegmentation,
        AutoProcessor,
        RawImage,
        env,
      } = await loadTransformers();

      // Browser-only WASM inference; cache weights in the origin cache.
      env.allowLocalModels = false;

      const processor = await AutoProcessor.from_pretrained(MODEL_ID);
      const model = await AutoModelForSemanticSegmentation.from_pretrained(
        MODEL_ID,
        {
          device: "wasm",
          dtype: "q8",
        },
      );

      return {
        model: model as SegmenterBundle["model"],
        processor: processor as unknown as SegmenterBundle["processor"],
        RawImage,
      };
    })().catch((error) => {
      segmenterPromise = null;
      throw error;
    });
  }
  onStatus?.("Loading segmentation model…");
  return segmenterPromise;
}

function labelsForClasses(classes: MaskClass[]) {
  const labels = new Set<string>();
  for (const cls of classes) {
    for (const label of LABEL_GROUPS[cls]) labels.add(label);
  }
  return labels;
}

function classIdsForLabels(
  id2label: Record<string, string> | undefined,
  wanted: Set<string>,
) {
  const ids = new Set<number>();
  if (!id2label) return ids;
  for (const [id, label] of Object.entries(id2label)) {
    if (wanted.has(label.toLowerCase())) {
      ids.add(Number(id));
    }
  }
  return ids;
}

/**
 * Build a photogrammetry mask for an equirect frame.
 * White = keep for reconstruction, black = masked out (people/cars/sky).
 */
export async function buildEquirectExclusionMask(
  source: HTMLCanvasElement,
  classes: MaskClass[],
  onStatus?: (message: string) => void,
) {
  if (classes.length === 0) {
    throw new Error("Select at least one mask class (people, cars, or sky).");
  }

  const wanted = labelsForClasses(classes);
  const { model, processor, RawImage } = await ensureMaskSegmenter(onStatus);

  // Downscale wide panoramas for speed; scale the mask back to source size.
  const maxWidth = 1024;
  const scale = Math.min(1, maxWidth / Math.max(1, source.width));
  const segWidth = Math.max(1, Math.round(source.width * scale));
  const segHeight = Math.max(1, Math.round(source.height * scale));
  const segCanvas = document.createElement("canvas");
  segCanvas.width = segWidth;
  segCanvas.height = segHeight;
  const segCtx = segCanvas.getContext("2d");
  if (!segCtx) throw new Error("2D canvas unavailable.");
  segCtx.drawImage(source, 0, 0, segWidth, segHeight);

  onStatus?.("Segmenting people / cars / sky…");
  const raw = RawImage.fromCanvas(segCanvas);
  const inputs = await processor(raw);
  const outputs = await model(inputs);
  const processed = processor.image_processor.post_process_semantic_segmentation(
    outputs,
    [[segHeight, segWidth]],
  );
  const { segmentation } = processed[0]!;
  const excludeIds = classIdsForLabels(model.config.id2label, wanted);

  const small = document.createElement("canvas");
  small.width = segWidth;
  small.height = segHeight;
  const smallCtx = small.getContext("2d", { willReadFrequently: true });
  if (!smallCtx) throw new Error("2D canvas unavailable.");
  const smallImage = smallCtx.createImageData(segWidth, segHeight);

  const data = segmentation.data;
  for (let i = 0; i < segWidth * segHeight; i += 1) {
    const excluded = excludeIds.has(Number(data[i]));
    const value = excluded ? 0 : 255;
    const px = i * 4;
    smallImage.data[px] = value;
    smallImage.data[px + 1] = value;
    smallImage.data[px + 2] = value;
    smallImage.data[px + 3] = 255;
  }
  smallCtx.putImageData(smallImage, 0, 0);

  const mask = document.createElement("canvas");
  mask.width = source.width;
  mask.height = source.height;
  const maskCtx = mask.getContext("2d", { willReadFrequently: true });
  if (!maskCtx) throw new Error("2D canvas unavailable.");
  maskCtx.imageSmoothingEnabled = false;
  maskCtx.drawImage(small, 0, 0, mask.width, mask.height);

  // Re-threshold after scale for crisp B/W masks.
  const full = maskCtx.getImageData(0, 0, mask.width, mask.height);
  for (let i = 0; i < full.data.length; i += 4) {
    const value = full.data[i]! >= 127 ? 255 : 0;
    full.data[i] = value;
    full.data[i + 1] = value;
    full.data[i + 2] = value;
    full.data[i + 3] = 255;
  }
  maskCtx.putImageData(full, 0, 0);
  return mask;
}
