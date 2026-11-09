import test from "node:test";
import assert from "node:assert/strict";
import { validateImageBuffer, imageValidationLimits } from "../../lib/image-validation.js";

function png(width = 600, height = 800) {
  const b = Buffer.alloc(24);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(b, 0);
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}
function webpVp8x(width = 600, height = 800) {
  const b = Buffer.alloc(30);
  b.write("RIFF", 0, "ascii");
  b.writeUInt32LE(22, 4);
  b.write("WEBP", 8, "ascii");
  b.write("VP8X", 12, "ascii");
  b[20] = 0;
  b.writeUIntLE(width - 1, 24, 3);
  b.writeUIntLE(height - 1, 27, 3);
  return b;
}
function jpeg(width = 600, height = 800) {
  const b = Buffer.alloc(24);
  let i = 0;
  b[i++] = 0xff; b[i++] = 0xd8;
  b[i++] = 0xff; b[i++] = 0xc0;
  b.writeUInt16BE(7, i); i += 2;
  b[i++] = 8;
  b.writeUInt16BE(height, i); i += 2;
  b.writeUInt16BE(width, i);
  return b;
}

test("accepts PNG signature and bounded dimensions", () => {
  assert.deepEqual(validateImageBuffer(png(), "image/png"), {
    ok: true, mimeType: "image/png", width: 600, height: 800
  });
});
test("accepts JPEG SOF dimensions", () => {
  assert.equal(validateImageBuffer(jpeg(), "image/jpeg").width, 600);
});
test("accepts WebP VP8X dimensions", () => {
  assert.equal(validateImageBuffer(webpVp8x(), "image/webp").height, 800);
});
test("rejects non-Buffer and undersized payloads", () => {
  assert.equal(validateImageBuffer("not bytes", "image/png").code, "IMAGE_BUFFER_REQUIRED");
  assert.equal(validateImageBuffer(Buffer.alloc(10), "image/png").code, "INVALID_IMAGE_SIZE");
});
test("rejects unsupported or forged signatures", () => {
  assert.equal(validateImageBuffer(Buffer.alloc(32, 1), "image/png").code, "UNRECOGNIZED_IMAGE_SIGNATURE");
});
test("rejects declared MIME mismatch", () => {
  assert.equal(validateImageBuffer(png(), "image/jpeg").code, "DECLARED_MIME_MISMATCH");
});
test("rejects malformed/truncated JPEG and WebP headers", () => {
  assert.equal(validateImageBuffer(Buffer.from([0xff,0xd8,0xff,0xc0,0,7,...Array(18).fill(0)]), "image/jpeg").code, "INVALID_IMAGE_HEADER");
  const b = Buffer.alloc(30);
  b.write("RIFF", 0, "ascii"); b.write("WEBP", 8, "ascii"); b.write("NOPE", 12, "ascii");
  assert.equal(validateImageBuffer(b, "image/webp").code, "INVALID_IMAGE_HEADER");
});
test("rejects zero dimensions", () => {
  assert.equal(validateImageBuffer(png(0, 800), "image/png").code, "INVALID_IMAGE_HEADER");
});
test("rejects excessive dimensions and pixel counts", () => {
  assert.equal(validateImageBuffer(png(imageValidationLimits.maxDimension + 1, 10), "image/png").code, "IMAGE_DIMENSIONS_EXCEEDED");
  assert.equal(validateImageBuffer(png(10000, 10000), "image/png").code, "IMAGE_DIMENSIONS_EXCEEDED");
});
