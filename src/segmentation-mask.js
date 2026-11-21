/**
 * Convert a low-resolution person-confidence mask into a smooth alpha value.
 * Coordinates are expressed in source-image pixels; mask samples are bilinearly
 * interpolated so the segmentation edge does not become a blocky nearest-neighbour stair-step.
 */
export function sampleFeatheredAlpha(mask, width, height, sourceX, sourceY, low = 0.28, high = 0.72) {
  if (!mask || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
      mask.length < width * height || !Number.isFinite(sourceX) || !Number.isFinite(sourceY) ||
      !Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high > 1 || high <= low) {
    throw new TypeError("A valid confidence mask, dimensions, coordinates and thresholds are required.");
  }
  const x = Math.max(0, Math.min(width - 1, sourceX));
  const y = Math.max(0, Math.min(height - 1, sourceY));
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0, ty = y - y0;
  const top = mask[y0 * width + x0] * (1 - tx) + mask[y0 * width + x1] * tx;
  const bottom = mask[y1 * width + x0] * (1 - tx) + mask[y1 * width + x1] * tx;
  const confidence = top * (1 - ty) + bottom * ty;
  const t = Math.max(0, Math.min(1, (confidence - low) / (high - low)));
  const smooth = t * t * (3 - 2 * t);
  return Math.round(smooth * 255);
}
