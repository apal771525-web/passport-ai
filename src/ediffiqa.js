// Experimental browser-side eDifFIQA-T inference.
// Upstream: https://github.com/yakhyo/face-image-quality-assessment (MIT).
// The upstream model expects an aligned 112x112 face crop. This prototype uses
// a square crop around the detector box, so its score is an approximate signal,
// not a calibrated passport-photo or identity-quality decision.
export const EDFFIQA_MODEL_URL = "https://github.com/yakhyo/face-image-quality-assessment/releases/download/weights/ediffiqa_t.onnx";
export const EDFFIQA_MODEL_SHA256 = "7a83be63e6583ec5800fa0762e219b65b4b9f1721c4d210bfe2f16c0478832bb";
export const EDFFIQA_MODEL_BYTES = 6901979;
export const EDFFIQA_INPUT_SIZE = 112;

export function prepareRgbTensor(rgba, width = 112, height = 112) {
  if (!(rgba instanceof Uint8ClampedArray || rgba instanceof Uint8Array) || width !== 112 || height !== 112 || rgba.length !== width * height * 4) {
    throw new TypeError("Expected RGBA pixels for a 112 × 112 face crop.");
  }
  const plane = width * height;
  const tensor = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    const p = i * 4;
    tensor[i] = rgba[p] / 127.5 - 1;
    tensor[plane + i] = rgba[p + 1] / 127.5 - 1;
    tensor[2 * plane + i] = rgba[p + 2] / 127.5 - 1;
  }
  return tensor;
}

export function getSquareFaceCrop(imageWidth, imageHeight, box, padding = 1.35) {
  const values = [imageWidth, imageHeight, box?.originX, box?.originY, box?.width, box?.height, padding];
  if (!values.every(Number.isFinite) || imageWidth <= 0 || imageHeight <= 0 || box.width <= 0 || box.height <= 0 || padding < 1) {
    throw new TypeError("Invalid face crop geometry.");
  }
  const cx = (box.originX + box.width / 2) * imageWidth;
  const cy = (box.originY + box.height / 2) * imageHeight;
  const side = Math.min(Math.max(box.width * imageWidth, box.height * imageHeight) * padding, imageWidth, imageHeight);
  const size = Math.max(1, side);
  const x = Math.max(0, Math.min(imageWidth - size, cx - size / 2));
  const y = Math.max(0, Math.min(imageHeight - size, cy - size / 2));
  return Object.freeze({ x, y, width: size, height: size });
}

async function loadOnnxRuntime() {
  const sources = [
    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.mjs",
    "https://unpkg.com/onnxruntime-web@1.22.0/dist/ort.min.mjs",
    "https://esm.sh/onnxruntime-web@1.22.0"
  ];
  let lastError;
  for (const source of sources) {
    try {
      const ort = await import(source);
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
      return ort;
    } catch (error) { lastError = error; }
  }
  throw new Error("ONNX Runtime could not load from its available sources. " + (lastError?.message || ""));
}

async function fetchVerifiedModel(fetchImpl) {
  const response = await fetchImpl(EDFFIQA_MODEL_URL);
  if (!response.ok) throw new Error("The face-quality model could not be downloaded (HTTP " + response.status + ").");
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== EDFFIQA_MODEL_BYTES) throw new Error("The downloaded face-quality model has an unexpected file size.");
  if (!globalThis.crypto?.subtle) throw new Error("This browser cannot verify the model file securely.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  if (hash !== EDFFIQA_MODEL_SHA256) throw new Error("The downloaded face-quality model failed its integrity check.");
  return bytes;
}

export async function scoreFaceQuality({ image, box, runtimeLoader = loadOnnxRuntime, fetchImpl = fetch }) {
  if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) throw new TypeError("Upload a valid photo first.");
  const crop = getSquareFaceCrop(image.naturalWidth, image.naturalHeight, box);
  const canvas = document.createElement("canvas");
  canvas.width = EDFFIQA_INPUT_SIZE;
  canvas.height = EDFFIQA_INPUT_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser could not create an image-processing canvas.");
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, 112, 112);
  const rgba = context.getImageData(0, 0, 112, 112).data;
  const data = prepareRgbTensor(rgba);
  const ort = await runtimeLoader();
  const model = await fetchVerifiedModel(fetchImpl);
  const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
  try {
    const inputName = session.inputNames?.[0] || "input";
    const outputName = session.outputNames?.[0] || "quality";
    const input = new ort.Tensor("float32", data, [1, 3, 112, 112]);
    const result = await session.run({ [inputName]: input });
    const raw = result[outputName]?.data?.[0];
    if (!Number.isFinite(raw)) throw new Error("The face-quality model returned an invalid score.");
    return Object.freeze({ score: raw, crop, note: "Experimental eDifFIQA-T score. This crop is not landmark-aligned; do not interpret it as passport acceptance or identity verification." });
  } finally {
    await session.release?.();
  }
}
