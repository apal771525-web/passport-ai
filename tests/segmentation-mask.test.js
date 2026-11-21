import test from "node:test";
import assert from "node:assert/strict";
import { sampleFeatheredAlpha } from "../src/segmentation-mask.js";

test("confidence is converted to transparent, feathered and opaque alpha", () => {
  const mask = new Float32Array([0, 0.5, 1]);
  assert.equal(sampleFeatheredAlpha(mask, 3, 1, 0, 0), 0);
  assert.ok(sampleFeatheredAlpha(mask, 3, 1, 1, 0) > 0);
  assert.equal(sampleFeatheredAlpha(mask, 3, 1, 2, 0), 255);
});

test("bilinear interpolation smooths between adjacent confidence samples", () => {
  const mask = new Float32Array([0, 1]);
  const midpoint = sampleFeatheredAlpha(mask, 2, 1, 0.5, 0);
  assert.equal(midpoint, 128);
  assert.ok(sampleFeatheredAlpha(mask, 2, 1, 0.25, 0) < midpoint);
  assert.ok(sampleFeatheredAlpha(mask, 2, 1, 0.75, 0) > midpoint);
});

test("coordinates clamp safely at image edges", () => {
  const mask = new Float32Array([0.9, 0.1, 0.2, 0.8]);
  assert.equal(sampleFeatheredAlpha(mask, 2, 2, -10, -10), 255);
  assert.equal(sampleFeatheredAlpha(mask, 2, 2, 10, 10), 255);
});

test("invalid masks and thresholds are rejected", () => {
  assert.throws(() => sampleFeatheredAlpha(null, 1, 1, 0, 0), TypeError);
  assert.throws(() => sampleFeatheredAlpha(new Float32Array(1), 0, 1, 0, 0), TypeError);
  assert.throws(() => sampleFeatheredAlpha(new Float32Array(1), 1, 1, 0, 0, 0.8, 0.2), TypeError);
});
