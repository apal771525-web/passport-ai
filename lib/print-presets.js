// Physical print dimensions are kept in millimetres. Never infer a DPI.
const presets = {
  "India|passport-minor-under4": Object.freeze({
    minWidthMm: 35, maxWidthMm: 35, minHeightMm: 45, maxHeightMm: 45,
    preferredWidthMm: 35, preferredHeightMm: 45,
    label: "India child under 4 — 35 × 45 mm"
  }),
  "Australia|passport-paper": Object.freeze({
    minWidthMm: 35, maxWidthMm: 40, minHeightMm: 45, maxHeightMm: 50,
    preferredWidthMm: 35, preferredHeightMm: 45,
    label: "Australia passport — 35–40 × 45–50 mm"
  })
};

export function getPrintPreset(country, route) {
  if (typeof country !== "string" || typeof route !== "string") return null;
  return presets[country + "|" + route] || null;
}

export function validatePrintDimensions(widthMm, heightMm, preset = null) {
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) ||
      widthMm < 20 || widthMm > 100 || heightMm < 20 || heightMm > 100) {
    return { valid: false, reason: "invalid_physical_dimensions" };
  }
  if (preset && (widthMm < preset.minWidthMm || widthMm > preset.maxWidthMm ||
      heightMm < preset.minHeightMm || heightMm > preset.maxHeightMm)) {
    return { valid: false, reason: "outside_official_range" };
  }
  return { valid: true, reason: null };
}

export function millimetresToPixels(mm, dpi) {
  if (!Number.isFinite(mm) || mm <= 0 || ![300, 600].includes(dpi)) {
    throw new RangeError("Use a positive millimetre size and 300 or 600 DPI.");
  }
  return Math.round(mm * dpi / 25.4);
}
