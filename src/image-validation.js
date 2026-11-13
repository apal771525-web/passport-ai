export const SUPPORTED_CONTENT_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export function normalizeContentType(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }

  return normalized;
}

export function validateImageUpload(file, options = {}) {
  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES;
  const allowedTypes = options.allowedTypes ?? SUPPORTED_CONTENT_TYPES;

  if (!file) {
    return {
      valid: false,
      errors: ['No file was selected.'],
      maxBytes,
      normalizedType: null
    };
  }

  const normalizedType = normalizeContentType(file.type);
  const errors = [];

  if (!normalizedType || !allowedTypes.includes(normalizedType)) {
    errors.push('Unsupported file format. Use JPG, PNG, or WebP.');
  }

  if (typeof file.size === 'number' && file.size > maxBytes) {
    errors.push(`File is too large. Maximum allowed size is ${formatFileSize(maxBytes)}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    maxBytes,
    normalizedType,
    fileSizeBytes: typeof file.size === 'number' ? file.size : 0
  };
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${Math.round(value)} ${units[unitIndex]}`;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 1 ? 0 : 1)} ${units[unitIndex]}`;
}

export async function readImageDimensions(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to decode the selected image.'));
      img.src = url;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      aspectRatio: image.naturalWidth / image.naturalHeight
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function isLikelySmallDimension(width, height) {
  return width < 300 || height < 300;
}

export function buildImageValidationSummary(file, context = {}) {
  const result = validateImageUpload(file, context);
  if (!result.valid) {
    return {
      ok: false,
      summary: result.errors.join(' '),
      ...result
    };
  }

  return {
    ok: true,
    summary: `Valid ${result.normalizedType.replace('image/', '').toUpperCase()} upload.`,
    ...result
  };
}
