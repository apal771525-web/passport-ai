import test from "node:test";
import assert from "node:assert/strict";
import { encodeJpegWithinTarget, validateTargetBytes } from "../src/jpeg-export.js";

const jpeg = size => ({ size, type: "image/jpeg" });

test("validates target byte limits", () => {
  assert.equal(validateTargetBytes(1024), 1024);
  assert.throws(() => validateTargetBytes(100), RangeError);
  assert.throws(() => validateTargetBytes(20 * 1024 * 1024 + 1), RangeError);
});

test("selects the highest quality found within the target size", async () => {
  const result = await encodeJpegWithinTarget({}, 50 * 1024, {
    iterations: 9,
    encoder: async quality => jpeg(Math.round(10_000 + quality * 60_000))
  });
  assert.equal(result.withinTarget, true);
  assert.ok(result.blob.size <= 50 * 1024);
  assert.ok(result.quality > 0.6);
});

test("reports when minimum JPEG quality still exceeds the target", async () => {
  const result = await encodeJpegWithinTarget({}, 1024, {
    encoder: async () => jpeg(4096)
  });
  assert.equal(result.withinTarget, false);
  assert.equal(result.quality, 0.35);
  assert.equal(result.blob.size, 4096);
});

test("rejects invalid encoder output", async () => {
  await assert.rejects(
    encodeJpegWithinTarget({}, 10 * 1024, { encoder: async () => ({ size: 0, type: "image/png" }) }),
    /invalid file/
  );
});
