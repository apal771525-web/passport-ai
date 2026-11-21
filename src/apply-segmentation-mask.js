/**
 * Apply a person-confidence mask to an RGBA image buffer.
 * Validation happens once per image rather than once per output pixel, which
 * avoids repeated checks in the expensive mobile-resolution loop.
 */
export function applyFeatheredMaskToImageData(imageData, sourceWidth, sourceHeight, mask, maskWidth, maskHeight, low = 0.28, high = 0.72) {
  if (!imageData || !imageData.data || !Number.isInteger(sourceWidth) || !Number.isInteger(sourceHeight) ||
      sourceWidth < 1 || sourceHeight < 1 || imageData.data.length < sourceWidth * sourceHeight * 4 ||
      !mask || !Number.isInteger(maskWidth) || !Number.isInteger(maskHeight) ||
      maskWidth < 1 || maskHeight < 1 || mask.length < maskWidth * maskHeight ||
      !Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high > 1 || high <= low) {
    throw new TypeError("A valid RGBA image, confidence mask, dimensions and thresholds are required.");
  }

  const pixels = imageData.data;
  const scaleX = maskWidth / sourceWidth;
  const scaleY = maskHeight / sourceHeight;
  const range = high - low;

  // Confidence masks should be in [0, 1]. Clamp finite samples and
  // treat non-finite model output as background instead of allowing NaN
  // to poison alpha and create unpredictable transparent pixels.
  const sample = index => {
    const value = mask[index];
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  };

  for (let y = 0; y < sourceHeight; y++) {
    const maskY = Math.max(0, Math.min(maskHeight - 1, (y + 0.5) * scaleY - 0.5));
    const y0 = Math.floor(maskY);
    const y1 = Math.min(maskHeight - 1, y0 + 1);
    const ty = maskY - y0;
    const row0 = y0 * maskWidth;
    const row1 = y1 * maskWidth;
    const pixelRow = y * sourceWidth * 4;

    for (let x = 0; x < sourceWidth; x++) {
      const maskX = Math.max(0, Math.min(maskWidth - 1, (x + 0.5) * scaleX - 0.5));
      const x0 = Math.floor(maskX);
      const x1 = Math.min(maskWidth - 1, x0 + 1);
      const tx = maskX - x0;
      const top = sample(row0 + x0) * (1 - tx) + sample(row0 + x1) * tx;
      const bottom = sample(row1 + x0) * (1 - tx) + sample(row1 + x1) * tx;
      const confidence = top * (1 - ty) + bottom * ty;
      const t = Math.max(0, Math.min(1, (confidence - low) / range));
      const smooth = t * t * (3 - 2 * t);
      const alphaIndex = pixelRow + x * 4 + 3;
      pixels[alphaIndex] = Math.round(pixels[alphaIndex] * smooth);
    }
  }
  return imageData;
}
