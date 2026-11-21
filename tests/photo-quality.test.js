import test from "node:test";
import assert from "node:assert/strict";
import { analyzePhotoPixels, analyzePhotoRegion, assessFaceFraming, validatePixelSample } from "../src/photo-quality.js";

function rgba(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fill[0]; data[i * 4 + 1] = fill[1]; data[i * 4 + 2] = fill[2]; data[i * 4 + 3] = 255;
  }
  return data;
}

test("validates bounded RGBA samples", () => {
  assert.equal(validatePixelSample(rgba(4, 4, [120, 120, 120]), 4, 4).valid, true);
  assert.equal(validatePixelSample(null, 4, 4).code, "INVALID_SAMPLE");
  assert.equal(validatePixelSample(new Array(64).fill(128), 4, 4).code, "INVALID_SAMPLE");
  assert.equal(validatePixelSample(new Float32Array(64), 4, 4).code, "INVALID_SAMPLE");
  assert.equal(validatePixelSample(new Uint8Array(4), 4, 4).code, "INVALID_SAMPLE_SIZE");
  assert.equal(validatePixelSample(rgba(257, 257, [0, 0, 0]), 257, 257).code, "INVALID_SAMPLE_SIZE");
});

test("reports brightness and clipping proportions for a uniform sample", () => {
  const result = analyzePhotoPixels(rgba(8, 8, [100, 100, 100]), 8, 8);
  assert.equal(result.valid, true);
  assert.equal(result.metrics.meanBrightness, 100);
  assert.equal(result.metrics.darkPixelPercent, 0);
  assert.equal(result.metrics.brightPixelPercent, 0);
  assert.equal(result.metrics.sharpnessVariance, 0);
});

test("composites transparent pixels over white for exposure estimates", () => {
  const transparent = new Uint8ClampedArray(8 * 8 * 4);
  for (let i = 0; i < 64; i++) transparent.set([0, 0, 0, 0], i * 4);
  const result = analyzePhotoPixels(transparent, 8, 8);
  assert.equal(result.valid, true);
  assert.equal(result.metrics.meanBrightness, 255);
  assert.equal(result.metrics.darkPixelPercent, 0);
  assert.equal(result.metrics.brightPixelPercent, 100);
});

test("partially transparent pixels are blended against white before sampling", () => {
  const data = new Uint8ClampedArray(8 * 8 * 4);
  for (let i = 0; i < 64; i++) data.set([0, 0, 0, 128], i * 4);
  const result = analyzePhotoPixels(data, 8, 8);
  assert.ok(result.metrics.meanBrightness > 126 && result.metrics.meanBrightness < 128);
  assert.equal(result.metrics.darkPixelPercent, 0);
});

test("detects very dark and very bright pixel proportions", () => {
  const data = rgba(4, 4, [0, 0, 0]);
  for (let i = 0; i < 8; i++) data.set([255, 255, 255, 255], i * 4);
  const result = analyzePhotoPixels(data, 4, 4);
  assert.equal(result.metrics.darkPixelPercent, 50);
  assert.equal(result.metrics.brightPixelPercent, 50);
});

test("detects edge detail as a higher sharpness signal than a flat sample", () => {
  const flat = rgba(8, 8, [128, 128, 128]);
  const edged = rgba(8, 8, [0, 0, 0]);
  for (let y = 0; y < 8; y++) for (let x = 4; x < 8; x++) edged.set([255, 255, 255, 255], (y * 8 + x) * 4);
  assert.ok(analyzePhotoPixels(edged, 8, 8).metrics.sharpnessVariance > analyzePhotoPixels(flat, 8, 8).metrics.sharpnessVariance);
});

test("analyzes sharpness and exposure only inside a validated face region", () => {
  const data = rgba(8, 8, [80, 80, 80]);
  for (let y = 2; y < 6; y++) {
    for (let x = 4; x < 7; x++) data.set([255, 255, 255, 255], (y * 8 + x) * 4);
  }
  const result = analyzePhotoRegion(data, 8, 8, { originX: 3, originY: 1, width: 4, height: 6 });
  assert.equal(result.valid, true);
  assert.equal(result.metrics.sampledWidth, 4);
  assert.equal(result.metrics.sampledHeight, 6);
  assert.ok(result.metrics.sharpnessVariance > 0);
  assert.equal(analyzePhotoRegion(data, 8, 8, { originX: 7, originY: 0, width: 2, height: 2 }).code, "INVALID_REGION");
});

test("rejects invalid face geometry", () => {
  assert.equal(assessFaceFraming(100, 100, null).code, "INVALID_FACE_GEOMETRY");
  assert.equal(assessFaceFraming(100, 100, { originX: 90, originY: 0, width: 20, height: 20 }).valid, false);
});

test("returns normalized face positioning hints", () => {
  const result = assessFaceFraming(1000, 1500, { originX: 400, originY: 450, width: 200, height: 300 });
  assert.equal(result.valid, true);
  assert.equal(result.metrics.centerXPercent, 50);
  assert.equal(result.metrics.centerYPercent, 40);
  assert.equal(result.metrics.faceWidthPercent, 20);
  assert.ok(result.hints[0].includes("centred"));
  assert.ok(Object.isFrozen(result.metrics));
});
