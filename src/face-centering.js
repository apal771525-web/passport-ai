export function suggestFaceCentering(request, faceBox) {
  const { sourceWidth, sourceHeight, width, height, zoom = 1 } = request || {};
  const values = [sourceWidth, sourceHeight, width, height, zoom, faceBox?.originX, faceBox?.originY, faceBox?.width, faceBox?.height];
  if (!values.every(Number.isFinite) || sourceWidth <= 0 || sourceHeight <= 0 || width <= 0 || height <= 0 || zoom < 1 ||
      faceBox.width <= 0 || faceBox.height <= 0 || faceBox.originX < 0 || faceBox.originY < 0 ||
      faceBox.originX + faceBox.width > sourceWidth || faceBox.originY + faceBox.height > sourceHeight) {
    return { valid: false, code: "INVALID_FACE_CROP_GEOMETRY" };
  }
  const scale = Math.max(width / sourceWidth, height / sourceHeight) * zoom;
  const cropWidth = Math.min(sourceWidth, width / scale);
  const cropHeight = Math.min(sourceHeight, height / scale);
  const maxLeft = Math.max(0, sourceWidth - cropWidth);
  const maxTop = Math.max(0, sourceHeight - cropHeight);
  const faceCenterX = faceBox.originX + faceBox.width / 2;
  const faceCenterY = faceBox.originY + faceBox.height / 2;
  const left = Math.min(maxLeft, Math.max(0, faceCenterX - cropWidth / 2));
  const top = Math.min(maxTop, Math.max(0, faceCenterY - cropHeight / 2));
  const horizontal = maxLeft ? Math.round((left / maxLeft) * 200 - 100) : 0;
  const vertical = maxTop ? Math.round((top / maxTop) * 200 - 100) : 0;
  return { valid: true, horizontal, vertical, cropWidth, cropHeight };
}
