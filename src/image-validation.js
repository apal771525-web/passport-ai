export const SUPPORTED_CONTENT_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;

export function normalizeContentType(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().toLowerCase();
  return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

export function validateImageUpload(file, options = {}) {
  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES;
  const allowedTypes = options.allowedTypes ?? SUPPORTED_CONTENT_TYPES;
  const errors = [];

  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new TypeError('maxBytes must be a positive safe integer.');
  }
  if (!Array.isArray(allowedTypes) || allowedTypes.some(type => typeof type !== 'string')) {
    throw new TypeError('allowedTypes must be an array of MIME type strings.');
  }

  if (!file || typeof file !== 'object') {
    return { valid: false, errors: ['No file was selected.'], maxBytes, normalizedType: null };
  }

  const normalizedType = normalizeContentType(file.type);
  if (!normalizedType || !allowedTypes.includes(normalizedType)) {
    errors.push('Unsupported file format. Use JPG, PNG or WebP.');
  }

  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    errors.push('The selected file has an invalid or empty size.');
  } else if (file.size > maxBytes) {
    errors.push(`File is too large. Maximum allowed size is ${formatFileSize(maxBytes)}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    maxBytes,
    normalizedType,
    fileSizeBytes: Number.isSafeInteger(file.size) && file.size > 0 ? file.size : null
  };
}

/**
 * Checks the file's actual magic bytes. MIME metadata supplied by a browser
 * or filename is not proof that the underlying bytes are an image.
 */
export async function validateImageSignature(file) {
  if (!file || typeof file.slice !== 'function') {
    return { valid: false, code: 'INVALID_FILE', message: 'A readable image file is required.' };
  }

  let bytes;
  try {
    bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  } catch {
    return { valid: false, code: 'UNREADABLE_FILE', message: 'The selected file could not be read.' };
  }

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  const detectedType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebp ? 'image/webp' : null;
  const declaredType = normalizeContentType(file.type);

  if (!detectedType) {
    return { valid: false, code: 'INVALID_SIGNATURE', message: 'The file contents are not a supported JPG, PNG or WebP image.' };
  }
  if (declaredType && declaredType !== detectedType) {
    return { valid: false, code: 'TYPE_MISMATCH', message: 'The file extension or declared format does not match its actual image contents.', detectedType };
  }

  return { valid: true, code: 'OK', detectedType };
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  if (unitIndex === 0) return `${Math.round(value)} ${units[unitIndex]}`;
  return `${value.toFixed(value >= 10 || unitIndex === 1 ? 0 : 1)} ${units[unitIndex]}`;
}

export async function readImageDimensions(file) {
  if (!file) throw new Error('No file selected.');
  if (typeof URL?.createObjectURL !== 'function' || typeof Image === 'undefined') {
    throw new Error('Image decoding is not available in this environment.');
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to decode the selected image.'));
      img.src = url;
    });

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
      throw new Error('The image has invalid dimensions.');
    }
    if (width * height > MAX_IMAGE_PIXELS) {
      throw new Error('The image dimensions are too large to process safely.');
    }

    return { width, height, aspectRatio: width / height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function isLikelySmallDimension(width, height) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 &&
    (width < 300 || height < 300);
}

export function buildImageValidationSummary(file, context = {}) {
  const result = validateImageUpload(file, context);
  if (!result.valid) return { ok: false, summary: result.errors.join(' '), ...result };
  return {
    ok: true,
    summary: `Valid ${result.normalizedType.replace('image/', '').toUpperCase()} upload. File signature must still be checked before decoding.`,
    ...result
  };
}
