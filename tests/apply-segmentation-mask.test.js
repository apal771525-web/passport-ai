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


test("synthetic portrait silhouette keeps a solid interior and a smooth monotonic edge", () => {
  const size = 9;
  const mask = new Float32Array(size * size);
  const center = (size - 1) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.hypot(x - center, y - center);
      // Synthetic soft person silhouette: opaque core, feathered boundary,
      // transparent exterior. This tests mask processing, not AI inference.
      mask[y * size + x] = Math.max(0, Math.min(1, (3.8 - distance) / 1.2));
    }
  }

  const image = rgba(size, size);
  applyFeatheredMaskToImageData(image, size, size, mask, size, size);

  const alphaAt = (x, y) => image.data[(y * size + x) * 4 + 3];
  assert.equal(alphaAt(4, 4), 255, "face/head interior should remain fully opaque");
  assert.equal(alphaAt(0, 0), 0, "far background should be transparent");

  const centerRow = Array.from({ length: size }, (_, x) => alphaAt(x, 4));
  for (let x = 1; x <= center; x++) {
    assert.ok(centerRow[x] >= centerRow[x - 1], "alpha should not decrease toward the silhouette center");
  }
  for (let x = center + 1; x < size; x++) {
    assert.ok(centerRow[x] <= centerRow[x - 1], "alpha should not increase beyond the silhouette center");
  }
  assert.ok(centerRow.some(value => value > 0 && value < 255), "silhouette edge should contain feathered alpha values");
});
