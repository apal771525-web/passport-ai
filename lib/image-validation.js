const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_DIMENSION = 12000;
const MAX_PIXELS = 40_000_000;

function fail(code) {
  return { ok: false, code };
}

function isPng(b) {
  return b.length >= 24 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    b.toString("ascii", 12, 16) === "IHDR";
}

function jpegDimensions(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    while (i < b.length && b[i] === 0xff) i++;
    if (i >= b.length) return null;
    const marker = b[i++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (i + 2 > b.length) return null;
    const segmentLength = b.readUInt16BE(i);
    if (segmentLength < 2 || i + segmentLength > b.length) return null;
    const isSof = [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker);
    if (isSof) {
      if (segmentLength < 7) return null;
      return { width: b.readUInt16BE(i + 5), height: b.readUInt16BE(i + 3) };
    }
    i += segmentLength;
  }
  return null;
}

function webpDimensions(b) {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" ||
      b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X" && b.length >= 30) {
    return {
      width: 1 + b.readUIntLE(24, 3),
      height: 1 + b.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8 " && b.length >= 30 &&
      b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L" && b.length >= 25 && b[20] === 0x2f) {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

/**
 * Validate actual image bytes before any AI provider receives them.
 * This is a conservative header/dimension gate, not a complete decoder
 * or malware scanner. Run a hardened image decoder and re-encode before
 * provider processing in the production pipeline.
 */
export function validateImageBuffer(input, declaredMimeType) {
  if (!Buffer.isBuffer(input)) return fail("IMAGE_BUFFER_REQUIRED");
  if (input.length < 24 || input.length > MAX_IMAGE_BYTES) return fail("INVALID_IMAGE_SIZE");

  let mimeType;
  let dimensions;
  if (isPng(input)) {
    mimeType = "image/png";
    dimensions = { width: input.readUInt32BE(16), height: input.readUInt32BE(20) };
  } else if (input.length >= 12 &&
      input.toString("ascii", 0, 4) === "RIFF" &&
      input.toString("ascii", 8, 12) === "WEBP") {
    mimeType = "image/webp";
    dimensions = webpDimensions(input);
  } else if (input[0] === 0xff && input[1] === 0xd8) {
    mimeType = "image/jpeg";
    dimensions = jpegDimensions(input);
  } else {
    return fail("UNRECOGNIZED_IMAGE_SIGNATURE");
  }

  if (mimeType !== declaredMimeType) return fail("DECLARED_MIME_MISMATCH");
  if (!dimensions || !Number.isSafeInteger(dimensions.width) ||
      !Number.isSafeInteger(dimensions.height) ||
      dimensions.width < 1 || dimensions.height < 1) return fail("INVALID_IMAGE_HEADER");
  if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION ||
      dimensions.width * dimensions.height > MAX_PIXELS) return fail("IMAGE_DIMENSIONS_EXCEEDED");

  return { ok: true, mimeType, width: dimensions.width, height: dimensions.height };
}

export const imageValidationLimits = Object.freeze({
  maxBytes: MAX_IMAGE_BYTES,
  maxDimension: MAX_DIMENSION,
  maxPixels: MAX_PIXELS,
});
