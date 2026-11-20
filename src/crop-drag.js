function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function calculateCropWindow(request) {
  const { sourceWidth, sourceHeight, width, height, zoom = 1, horizontal = 0, vertical = 0 } = request || {};
  const values = [sourceWidth, sourceHeight, width, height, zoom, horizontal, vertical];
  if (!values.every(Number.isFinite) || sourceWidth <= 0 || sourceHeight <= 0 ||
      width <= 0 || height <= 0 || zoom < 1 || horizontal < -100 || horizontal > 100 ||
      vertical < -100 || vertical > 100) {
    return { valid: false, code: "INVALID_CROP_GEOMETRY" };
  }

  const scale = Math.max(width / sourceWidth, height / sourceHeight) * zoom;
  const cropWidth = Math.min(sourceWidth, width / scale);
  const cropHeight = Math.min(sourceHeight, height / scale);
  const maxLeft = Math.max(0, sourceWidth - cropWidth);
  const maxTop = Math.max(0, sourceHeight - cropHeight);
  const left = maxLeft * (horizontal + 100) / 200;
  const top = maxTop * (vertical + 100) / 200;

  return {
    valid: true,
    left,
    top,
    width: cropWidth,
    height: cropHeight,
    leftPercent: left / sourceWidth * 100,
    topPercent: top / sourceHeight * 100,
    widthPercent: cropWidth / sourceWidth * 100,
    heightPercent: cropHeight / sourceHeight * 100,
    overflowX: maxLeft,
    overflowY: maxTop,
  };
}

export function moveCropWindow(request, deltaX, deltaY, displayWidth, displayHeight) {
  const current = calculateCropWindow(request);
  if (!current.valid || ![deltaX, deltaY, displayWidth, displayHeight].every(Number.isFinite) ||
      displayWidth <= 0 || displayHeight <= 0) {
    return { valid: false, code: "INVALID_DRAG_INPUT" };
  }

  const { sourceWidth, sourceHeight } = request;
  const displayScaleX = displayWidth / sourceWidth;
  const displayScaleY = displayHeight / sourceHeight;
  const overflowDisplayX = current.overflowX * displayScaleX;
  const overflowDisplayY = current.overflowY * displayScaleY;
  const horizontal = overflowDisplayX > 0
    ? clamp(request.horizontal + deltaX / overflowDisplayX * 200, -100, 100)
    : request.horizontal;
  const vertical = overflowDisplayY > 0
    ? clamp(request.vertical + deltaY / overflowDisplayY * 200, -100, 100)
    : request.vertical;

  return { valid: true, horizontal, vertical };
}
