import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_PIXELS,
  buildImageValidationSummary,
  isLikelySmallDimension,
  normalizeContentType,
  validateImageSignature,
  validateImageUpload
} from '../src/image-validation.js';

const fakeFile = (type, size, bytes = []) => ({
  type,
  size,
  slice: () => new Blob([new Uint8Array(bytes)])
});

test('normalizes JPG MIME alias', () => {
  assert.equal(normalizeContentType(' IMAGE/JPG '), 'image/jpeg');
});

test('accepts supported image metadata and positive size', () => {
  assert.equal(validateImageUpload({ type: 'image/jpeg', size: 1024 }).valid, true);
});

test('rejects missing file', () => {
  assert.equal(validateImageUpload(null).valid, false);
});

test('rejects unsupported MIME type', () => {
  assert.equal(validateImageUpload({ type: 'image/gif', size: 100 }).valid, false);
});

test('rejects missing, zero, negative and unsafe file sizes', () => {
  for (const size of [undefined, 0, -1, Number.MAX_SAFE_INTEGER + 1, NaN]) {
    assert.equal(validateImageUpload({ type: 'image/jpeg', size }).valid, false);
  }
});

test('rejects files larger than the configured limit', () => {
  assert.equal(validateImageUpload({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }).valid, false);
});

test('accepts a file exactly at the configured limit', () => {
  assert.equal(validateImageUpload({ type: 'image/png', size: MAX_IMAGE_BYTES }).valid, true);
});

test('rejects invalid validation configuration', () => {
  assert.throws(() => validateImageUpload({ type: 'image/jpeg', size: 10 }, { maxBytes: 0 }), TypeError);
  assert.throws(() => validateImageUpload({ type: 'image/jpeg', size: 10 }, { allowedTypes: 'image/jpeg' }), TypeError);
});

test('validates JPEG magic bytes', async () => {
  const result = await validateImageSignature(fakeFile('image/jpeg', 3, [0xff, 0xd8, 0xff]));
  assert.equal(result.valid, true);
  assert.equal(result.detectedType, 'image/jpeg');
});

test('validates PNG magic bytes', async () => {
  const result = await validateImageSignature(fakeFile('image/png', 8, [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  assert.equal(result.valid, true);
  assert.equal(result.detectedType, 'image/png');
});

test('validates WebP RIFF signature', async () => {
  const result = await validateImageSignature(fakeFile('image/webp', 12, [0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50]));
  assert.equal(result.valid, true);
  assert.equal(result.detectedType, 'image/webp');
});

test('rejects a fake image with text bytes', async () => {
  const result = await validateImageSignature(fakeFile('image/jpeg', 4, [0x41,0x42,0x43,0x44]));
  assert.equal(result.valid, false);
  assert.equal(result.code, 'INVALID_SIGNATURE');
});

test('rejects MIME and actual byte signature mismatch', async () => {
  const result = await validateImageSignature(fakeFile('image/png', 3, [0xff,0xd8,0xff]));
  assert.equal(result.valid, false);
  assert.equal(result.code, 'TYPE_MISMATCH');
});

test('rejects unreadable file objects', async () => {
  const result = await validateImageSignature({});
  assert.equal(result.valid, false);
});

test('small-dimension helper rejects invalid dimensions', () => {
  assert.equal(isLikelySmallDimension(200, 400), true);
  assert.equal(isLikelySmallDimension(800, 800), false);
  assert.equal(isLikelySmallDimension(0, 800), false);
  assert.equal(isLikelySmallDimension(NaN, 800), false);
});

test('summary marks metadata as valid but does not claim signature validation', () => {
  const result = buildImageValidationSummary({ type: 'image/jpeg', size: 100 });
  assert.equal(result.ok, true);
  assert.match(result.summary, /signature must still be checked/i);
});

test('pixel ceiling is a documented finite positive safety limit', () => {
  assert.equal(Number.isSafeInteger(MAX_IMAGE_PIXELS), true);
  assert.ok(MAX_IMAGE_PIXELS > 0);
});
