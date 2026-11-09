// Route-specific output constraints. Physical print dimensions are never converted to pixels
// unless a DPI is explicitly supplied by the user.
const presets = {
  "United States|visa-digital": Object.freeze({
    format: "image/jpeg",
    minWidth: 600,
    minHeight: 600,
    maxWidth: 1200,
    maxHeight: 1200,
    aspectRatio: 1,
    preferredWidth: 600,
    preferredHeight: 600,
    maxBytes: 240000,
    label: "US digital visa photo"
  })
};

export function getOutputPreset(country, route) {
  if (typeof country !== "string" || typeof route !== "string") return null;
  return presets[country + "|" + route] || null;
}

export function validateOutputDimensions(width, height, preset) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return { valid: false, reason: "invalid_dimensions" };
  }
  if (!preset) return { valid: true, reason: null };
  if (width < preset.minWidth || height < preset.minHeight ||
      width > preset.maxWidth || height > preset.maxHeight) {
    return { valid: false, reason: "outside_allowed_range" };
  }
  if (preset.aspectRatio && Math.abs(width / height - preset.aspectRatio) > 0.000001) {
    return { valid: false, reason: "wrong_aspect_ratio" };
  }
  return { valid: true, reason: null };
}
