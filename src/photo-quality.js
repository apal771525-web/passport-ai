const MAX_ANALYSIS_PIXELS = 256 * 256;

export function validatePixelSample(data, width, height) {
  if (!data || typeof data.length !== "number" || !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 3 || height < 3) {
    return { valid: false, code: "INVALID_SAMPLE" };
  }
  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels > MAX_ANALYSIS_PIXELS || data.length !== pixels * 4) {
    return { valid: false, code: "INVALID_SAMPLE_SIZE" };
  }
  return { valid: true, pixels };
}

export function analyzePhotoPixels(data, width, height) {
  const validation = validatePixelSample(data, width, height);
  if (!validation.valid) return { valid: false, code: validation.code, metrics: null };

  const gray = new Float64Array(validation.pixels);
  let total = 0, dark = 0, bright = 0;
  for (let i = 0, p = 0; i < validation.pixels; i++, p += 4) {
    const value = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
    gray[i] = value;
    total += value;
    if (value < 25) dark++;
    if (value > 245) bright++;
  }

  const meanBrightness = total / validation.pixels;
  let lapTotal = 0, lapSquaredTotal = 0, samples = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const laplacian = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      lapTotal += laplacian;
      lapSquaredTotal += laplacian * laplacian;
      samples++;
    }
  }
  const laplacianMean = samples ? lapTotal / samples : 0;
  const sharpnessVariance = samples ? Math.max(0, lapSquaredTotal / samples - laplacianMean ** 2) : 0;
  const metrics = Object.freeze({
    meanBrightness: Number(meanBrightness.toFixed(2)),
    darkPixelPercent: Number((dark / validation.pixels * 100).toFixed(2)),
    brightPixelPercent: Number((bright / validation.pixels * 100).toFixed(2)),
    sharpnessVariance: Number(sharpnessVariance.toFixed(2)),
    sampledWidth: width,
    sampledHeight: height
  });
  return { valid: true, metrics };
}

export function analyzePhotoRegion(data, width, height, box) {
  const validation = validatePixelSample(data, width, height);
  if (!validation.valid) return { valid: false, code: validation.code, metrics: null };
  if (!box || ![box.originX, box.originY, box.width, box.height].every(Number.isFinite) ||
      box.width <= 0 || box.height <= 0 || box.originX < 0 || box.originY < 0 ||
      box.originX + box.width > width || box.originY + box.height > height) {
    return { valid: false, code: "INVALID_REGION", metrics: null };
  }
  const left = Math.floor(box.originX), top = Math.floor(box.originY);
  const right = Math.ceil(box.originX + box.width), bottom = Math.ceil(box.originY + box.height);
  const cropWidth = right - left, cropHeight = bottom - top;
  if (cropWidth < 3 || cropHeight < 3 || cropWidth * cropHeight > MAX_ANALYSIS_PIXELS) {
    return { valid: false, code: "INVALID_REGION_SIZE", metrics: null };
  }
  const cropped = new Uint8ClampedArray(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y++) {
    const start = ((top + y) * width + left) * 4;
    cropped.set(data.subarray(start, start + cropWidth * 4), y * cropWidth * 4);
  }
  return analyzePhotoPixels(cropped, cropWidth, cropHeight);
}

export function assessFaceFraming(imageWidth, imageHeight, box) {
  if (!Number.isSafeInteger(imageWidth) || !Number.isSafeInteger(imageHeight) || imageWidth <= 0 || imageHeight <= 0 || !box) {
    return { valid: false, code: "INVALID_FACE_GEOMETRY", metrics: null };
  }
  const values = [box.originX, box.originY, box.width, box.height];
  if (!values.every(Number.isFinite) || box.width <= 0 || box.height <= 0 || box.originX < 0 || box.originY < 0 || box.originX + box.width > imageWidth || box.originY + box.height > imageHeight) {
    return { valid: false, code: "INVALID_FACE_GEOMETRY", metrics: null };
  }
  const metrics = Object.freeze({
    centerXPercent: Number(((box.originX + box.width / 2) / imageWidth * 100).toFixed(1)),
    centerYPercent: Number(((box.originY + box.height / 2) / imageHeight * 100).toFixed(1)),
    faceWidthPercent: Number((box.width / imageWidth * 100).toFixed(1)),
    faceHeightPercent: Number((box.height / imageHeight * 100).toFixed(1))
  });
  const hints = [];
  if (metrics.centerXPercent < 42) hints.push("Face appears left of centre.");
  else if (metrics.centerXPercent > 58) hints.push("Face appears right of centre.");
  else hints.push("Face appears roughly centred horizontally.");
  if (metrics.centerYPercent < 35) hints.push("Face appears high in the frame.");
  else if (metrics.centerYPercent > 68) hints.push("Face appears low in the frame.");
  else hints.push("Face appears around the middle vertically.");
  return { valid: true, metrics, hints };
}
