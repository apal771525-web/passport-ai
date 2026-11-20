const MIN_TARGET_BYTES = 1024;
const MAX_TARGET_BYTES = 20 * 1024 * 1024;

export function validateTargetBytes(value) {
  const bytes = Number(value);
  if (!Number.isSafeInteger(bytes) || bytes < MIN_TARGET_BYTES || bytes > MAX_TARGET_BYTES) {
    throw new RangeError("Target size must be between 1 KB and 20,480 KB.");
  }
  return bytes;
}

/**
 * Finds the highest JPEG quality that fits the requested byte budget.
 * If even minimum quality is too large, returns that smallest candidate and
 * reports withinTarget=false rather than silently pretending the limit passed.
 */
export async function encodeJpegWithinTarget(canvas, targetBytes, options = {}) {
  const target = validateTargetBytes(targetBytes);
  const minQuality = options.minQuality ?? 0.35;
  const maxQuality = options.maxQuality ?? 0.95;
  const iterations = options.iterations ?? 9;
  const encoder = options.encoder ?? ((quality) => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("The browser could not encode this JPEG.")), "image/jpeg", quality);
  }));

  if (!Number.isFinite(minQuality) || !Number.isFinite(maxQuality) || minQuality <= 0 || maxQuality > 1 || minQuality > maxQuality) {
    throw new RangeError("JPEG quality bounds must be between 0 and 1.");
  }
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 20) {
    throw new RangeError("Iterations must be an integer from 1 to 20.");
  }

  const smallest = await encoder(minQuality);
  if (!smallest || smallest.type !== "image/jpeg" || !Number.isFinite(smallest.size) || smallest.size <= 0) {
    throw new Error("JPEG encoder returned an invalid file.");
  }
  if (smallest.size > target) return { blob: smallest, withinTarget: false, quality: minQuality, targetBytes: target };

  let best = { blob: smallest, quality: minQuality };
  let low = minQuality, high = maxQuality;
  for (let i = 0; i < iterations; i++) {
    const quality = (low + high) / 2;
    const candidate = await encoder(quality);
    if (!candidate || candidate.type !== "image/jpeg" || !Number.isFinite(candidate.size) || candidate.size <= 0) {
      throw new Error("JPEG encoder returned an invalid file.");
    }
    if (candidate.size <= target) {
      best = { blob: candidate, quality };
      low = quality;
    } else {
      high = quality;
    }
  }
  return { ...best, withinTarget: true, targetBytes: target };
}
