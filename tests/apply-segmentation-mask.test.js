import test from "node:test";
import assert from "node:assert/strict";
import { applyFeatheredMaskToImageData } from "../src/apply-segmentation-mask.js";

function rgba(width, height, alpha = 255) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = 30;
    data[i * 4 + 1] = 60;
    data[i * 4 + 2] = 90;
    data[i * 4 + 3] = alpha;
  }
  return { data };
}

test("opaque confidence keeps source alpha and RGB channels unchanged", () => {
  const image = rgba(2, 1);
  applyFeatheredMaskToImageData(image, 2, 1, new Float32Array([1, 1]), 2, 1);
  assert.deepEqual([...image.data], [30, 60, 90, 255, 30, 60, 90, 255]);
});

test("background confidence clears alpha without changing RGB", () => {
  const image = rgba(2, 1);
  applyFeatheredMaskToImageData(image, 2, 1, new Float32Array([0, 0]), 2, 1);
  assert.deepEqual([...image.data], [30, 60, 90, 0, 30, 60, 90, 0]);
});

test("confidence transition produces intermediate alpha", () => {
  const image = rgba(3, 1);
  applyFeatheredMaskToImageData(image, 3, 1, new Float32Array([0, 0.5, 1]), 3, 1);
  assert.equal(image.data[3], 0);
  assert.ok(image.data[7] > 0 && image.data[7] < 255);
  assert.equal(image.data[11], 255);
});

test("resamples a lower-resolution mask across source pixels", () => {
  const image = rgba(4, 1);
  applyFeatheredMaskToImageData(image, 4, 1, new Float32Array([0, 1]), 2, 1);
  assert.ok(image.data[3] <= image.data[7]);
  assert.ok(image.data[7] < image.data[11]);
  assert.ok(image.data[11] <= image.data[15]);
});

test("rejects invalid image buffers, mask sizes and thresholds", () => {
  assert.throws(() => applyFeatheredMaskToImageData(null, 1, 1, new Float32Array([1]), 1, 1), TypeError);
  assert.throws(() => applyFeatheredMaskToImageData(rgba(1, 1), 1, 1, new Float32Array(0), 1, 1), TypeError);
  assert.throws(() => applyFeatheredMaskToImageData(rgba(1, 1), 1, 1, new Float32Array([1]), 1, 1, 0.8, 0.2), TypeError);
});

test("sanitizes non-finite and out-of-range confidence values", () => {
  const image = rgba(4, 1);
  applyFeatheredMaskToImageData(image, 4, 1, new Float32Array([NaN, -2, 2, 1]), 4, 1);
  assert.deepEqual([image.data[3], image.data[7], image.data[11], image.data[15]], [0, 0, 255, 255]);
});
