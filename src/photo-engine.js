export const PHOTO_LIMITS = Object.freeze({
  minOutputDimension: 100,
  maxOutputDimension: 3000,
  minZoom: 1,
  maxZoom: 2.5,
  minPosition: -100,
  maxPosition: 100,
});

export const PHOTO_BACKGROUNDS = Object.freeze({
  white: "#ffffff",
  lightgray: "#eeeeee",
  blue: "#e5efff",
});

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function validatePhotoRenderRequest(request) {
  if (!request || typeof request !== "object") {
    return { valid: false, code: "INVALID_REQUEST", message: "Photo settings are missing." };
  }

  const { sourceWidth, sourceHeight, width, height, zoom = 1, horizontal = 0, vertical = 0, background = "white" } = request;
  if (![sourceWidth, sourceHeight, width, height, zoom, horizontal, vertical].every(finiteNumber)) {
    return { valid: false, code: "NON_FINITE_VALUE", message: "Photo dimensions and framing values must be finite numbers." };
  }
  if (![sourceWidth, sourceHeight, width, height].every(Number.isInteger) ||
      sourceWidth <= 0 || sourceHeight <= 0) {
    return { valid: false, code: "INVALID_DIMENSIONS", message: "Source and output dimensions must be positive whole numbers." };
  }
  if (width < PHOTO_LIMITS.minOutputDimension || height < PHOTO_LIMITS.minOutputDimension ||
      width > PHOTO_LIMITS.maxOutputDimension || height > PHOTO_LIMITS.maxOutputDimension) {
    return { valid: false, code: "OUTPUT_DIMENSION_OUT_OF_RANGE", message: "Output dimensions must be between 100 and 3000 pixels." };
  }
  if (zoom < PHOTO_LIMITS.minZoom || zoom > PHOTO_LIMITS.maxZoom) {
    return { valid: false, code: "ZOOM_OUT_OF_RANGE", message: "Zoom must be between 1× and 2.5×." };
  }
  if (horizontal < PHOTO_LIMITS.minPosition || horizontal > PHOTO_LIMITS.maxPosition ||
      vertical < PHOTO_LIMITS.minPosition || vertical > PHOTO_LIMITS.maxPosition) {
    return { valid: false, code: "POSITION_OUT_OF_RANGE", message: "Framing position must be between -100 and 100." };
  }
  if (!Object.hasOwn(PHOTO_BACKGROUNDS, background)) {
    return { valid: false, code: "UNSUPPORTED_BACKGROUND", message: "Choose a supported background colour." };
  }

  return { valid: true, code: "VALID", message: "Photo render settings are valid." };
}

export function calculatePhotoRenderPlan(request) {
  const validation = validatePhotoRenderRequest(request);
  if (!validation.valid) {
    return { ...validation, plan: null };
  }

  const { sourceWidth, sourceHeight, width, height, zoom = 1, horizontal = 0, vertical = 0, background = "white" } = request;
  const coverScale = Math.max(width / sourceWidth, height / sourceHeight);
  const scale = coverScale * zoom;
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const overflowX = Math.max(0, drawWidth - width);
  const overflowY = Math.max(0, drawHeight - height);
  const drawX = overflowX === 0 ? 0 : -overflowX * (horizontal + 100) / 200;
  const drawY = overflowY === 0 ? 0 : -overflowY * (vertical + 100) / 200;

  return {
    valid: true,
    code: "VALID",
    message: "Photo render plan created.",
    plan: Object.freeze({
      width,
      height,
      background: PHOTO_BACKGROUNDS[background],
      drawX,
      drawY,
      drawWidth,
      drawHeight,
      scale,
      enlargesSource: scale > 1.01,
      enlargementPercent: Math.max(0, Math.round((scale - 1) * 100)),
    }),
  };
}
