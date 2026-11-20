export const PHOTO_PRESETS = Object.freeze({
  "india-35x45": Object.freeze({ label: "35 × 45 mm (common passport print size)", widthMm: 35, heightMm: 45 }),
  "square-2x2": Object.freeze({ label: "2 × 2 inches (51 × 51 mm)", widthMm: 50.8, heightMm: 50.8 }),
  "us-2x2": Object.freeze({ label: "US 2 × 2 inches", widthMm: 50.8, heightMm: 50.8 }),
  "canada-50x70": Object.freeze({ label: "Canada print format 50 × 70 mm", widthMm: 50, heightMm: 70 }),
  "custom": Object.freeze({ label: "Custom dimensions", widthMm: null, heightMm: null })
});
export function millimetresToPixels(mm, dpi = 300) {
  if (!Number.isFinite(mm) || mm <= 0 || !Number.isFinite(dpi) || dpi < 1 || dpi > 2400) throw new RangeError("Millimetres must be positive and DPI must be between 1 and 2400.");
  return Math.round((mm / 25.4) * dpi);
}
export function customDimensionsToPixels(width, height, unit, dpi = 300) {
  if (![width,height].every(Number.isFinite) || width <= 0 || height <= 0) throw new RangeError("Custom size must be positive.");
  if (unit === "px") return Object.freeze({width:Math.round(width),height:Math.round(height)});
  const factor = {mm:1,cm:10,inch:25.4}[unit];
  if (!factor) throw new TypeError("Choose mm, cm, inch or px.");
  return Object.freeze({width:millimetresToPixels(width*factor,dpi),height:millimetresToPixels(height*factor,dpi)});
}
