import test from "node:test";
import assert from "node:assert/strict";
import { prepareRgbTensor, getSquareFaceCrop, normalizeFaceBox, EDFFIQA_MODEL_SHA256, EDFFIQA_MODEL_BYTES } from "../src/ediffiqa.js";

test("eDifFIQA-T model metadata pins the upstream model artifact", () => {
  assert.equal(EDFFIQA_MODEL_BYTES, 6901979);
  assert.match(EDFFIQA_MODEL_SHA256, /^[a-f0-9]{64}$/);
});

test("prepares RGB NCHW tensor normalized to [-1, 1]", () => {
  const pixels = new Uint8ClampedArray(112 * 112 * 4);
  pixels[0] = 0; pixels[1] = 127; pixels[2] = 255; pixels[3] = 255;
  const tensor = prepareRgbTensor(pixels);
  assert.equal(tensor.length, 3 * 112 * 112);
  assert.equal(tensor[0], -1);
  assert.ok(Math.abs(tensor[112 * 112 + 0] - (127 / 127.5 - 1)) < 1e-6);
  assert.equal(tensor[2 * 112 * 112], 1);
});

test("rejects incorrect face crop input dimensions", () => {
  assert.throws(() => prepareRgbTensor(new Uint8ClampedArray(4)), /112/);
});

test("builds a square crop around a normalized face box", () => {
  const crop = getSquareFaceCrop(720, 1600, { originX: 0.3, originY: 0.2, width: 0.25, height: 0.2 });
  assert.equal(crop.width, crop.height);
  assert.ok(crop.x >= 0 && crop.y >= 0);
  assert.ok(crop.x + crop.width <= 720);
  assert.ok(crop.y + crop.height <= 1600);
});

test("rejects invalid face geometry", () => {
  assert.throws(() => getSquareFaceCrop(720, 1600, { originX: 0, originY: 0, width: 0, height: 0.2 }), /geometry/);
});

test("normalizes MediaPipe pixel bounding boxes for the AI crop helper", () => {
  const normalized = normalizeFaceBox(
    { originX: 216, originY: 320, width: 180, height: 240 },
    720,
    1600
  );
  assert.deepEqual(normalized, { originX: 0.3, originY: 0.2, width: 0.25, height: 0.15 });
  const crop = getSquareFaceCrop(720, 1600, normalized);
  assert.ok(crop.x >= 0 && crop.y >= 0);
  assert.ok(crop.x + crop.width <= 720);
  assert.ok(crop.y + crop.height <= 1600);
});

test("rejects invalid pixel face boxes before normalization", () => {
  assert.throws(() => normalizeFaceBox({ originX: 0, originY: 0, width: 0, height: 10 }, 720, 1600), /pixel face box/);
});
