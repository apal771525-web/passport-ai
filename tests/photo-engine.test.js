import test from "node:test";
import assert from "node:assert/strict";
import { calculatePhotoRenderPlan, validatePhotoRenderRequest } from "../src/photo-engine.js";

const valid = {
  sourceWidth: 1200,
  sourceHeight: 1800,
  width: 600,
  height: 900,
  zoom: 1,
  horizontal: 0,
  vertical: 0,
  background: "white",
};

test("accepts a valid photo render request", () => {
  assert.equal(validatePhotoRenderRequest(valid).valid, true);
});

test("rejects missing request", () => {
  assert.equal(validatePhotoRenderRequest(null).code, "INVALID_REQUEST");
});

test("rejects non-finite dimensions and controls", () => {
  for (const patch of [{ width: NaN }, { height: Infinity }, { zoom: -Infinity }, { horizontal: NaN }]) {
    assert.equal(validatePhotoRenderRequest({ ...valid, ...patch }).code, "NON_FINITE_VALUE");
  }
});

test("rejects non-integer and non-positive source dimensions", () => {
  assert.equal(validatePhotoRenderRequest({ ...valid, sourceWidth: 1200.5 }).code, "INVALID_DIMENSIONS");
  assert.equal(validatePhotoRenderRequest({ ...valid, sourceHeight: 0 }).code, "INVALID_DIMENSIONS");
});

test("enforces output dimension lower and upper bounds", () => {
  assert.equal(validatePhotoRenderRequest({ ...valid, width: 99 }).code, "OUTPUT_DIMENSION_OUT_OF_RANGE");
  assert.equal(validatePhotoRenderRequest({ ...valid, height: 3001 }).code, "OUTPUT_DIMENSION_OUT_OF_RANGE");
  assert.equal(validatePhotoRenderRequest({ ...valid, width: 100 }).valid, true);
  assert.equal(validatePhotoRenderRequest({ ...valid, height: 3000 }).valid, true);
});

test("enforces zoom bounds", () => {
  assert.equal(validatePhotoRenderRequest({ ...valid, zoom: 0.99 }).code, "ZOOM_OUT_OF_RANGE");
  assert.equal(validatePhotoRenderRequest({ ...valid, zoom: 2.51 }).code, "ZOOM_OUT_OF_RANGE");
});

test("enforces crop position bounds", () => {
  assert.equal(validatePhotoRenderRequest({ ...valid, horizontal: -101 }).code, "POSITION_OUT_OF_RANGE");
  assert.equal(validatePhotoRenderRequest({ ...valid, vertical: 101 }).code, "POSITION_OUT_OF_RANGE");
});

test("rejects unknown background names", () => {
  assert.equal(validatePhotoRenderRequest({ ...valid, background: "transparent" }).code, "UNSUPPORTED_BACKGROUND");
});

test("calculates a centred cover crop without distortion", () => {
  const result = calculatePhotoRenderPlan(valid);
  assert.equal(result.valid, true);
  assert.equal(result.plan.drawWidth, 600);
  assert.equal(result.plan.drawHeight, 900);
  assert.equal(result.plan.drawX, 0);
  assert.equal(result.plan.drawY, 0);
});

test("centres a wide source image by cropping horizontal overflow", () => {
  const result = calculatePhotoRenderPlan({ ...valid, sourceWidth: 2400, sourceHeight: 900 });
  assert.equal(result.valid, true);
  assert.ok(result.plan.drawWidth > result.plan.width);
  assert.equal(result.plan.drawX, -(result.plan.drawWidth - result.plan.width) / 2);
  assert.equal(result.plan.drawY, 0);
});

test("horizontal framing moves crop from left to right", () => {
  const left = calculatePhotoRenderPlan({ ...valid, sourceWidth: 2400, sourceHeight: 900, horizontal: -100 });
  const right = calculatePhotoRenderPlan({ ...valid, sourceWidth: 2400, sourceHeight: 900, horizontal: 100 });
  assert.equal(left.plan.drawX, 0);
  assert.equal(right.plan.drawX, -(right.plan.drawWidth - right.plan.width));
});

test("vertical framing moves crop from top to bottom", () => {
  const top = calculatePhotoRenderPlan({ ...valid, sourceWidth: 900, sourceHeight: 2400, vertical: -100 });
  const bottom = calculatePhotoRenderPlan({ ...valid, sourceWidth: 900, sourceHeight: 2400, vertical: 100 });
  assert.equal(top.plan.drawY, 0);
  assert.equal(bottom.plan.drawY, -(bottom.plan.drawHeight - bottom.plan.height));
});

test("zoom increases rendered source dimensions", () => {
  const base = calculatePhotoRenderPlan(valid);
  const zoomed = calculatePhotoRenderPlan({ ...valid, zoom: 2 });
  assert.ok(zoomed.plan.drawWidth > base.plan.drawWidth);
  assert.ok(zoomed.plan.drawHeight > base.plan.drawHeight);
});

test("reports source enlargement when upscaling is needed", () => {
  const result = calculatePhotoRenderPlan({ ...valid, sourceWidth: 300, sourceHeight: 450 });
  assert.equal(result.plan.enlargesSource, true);
  assert.ok(result.plan.enlargementPercent > 0);
});

test("returns a frozen plan", () => {
  const result = calculatePhotoRenderPlan(valid);
  assert.equal(Object.isFrozen(result.plan), true);
});

test("returns no plan for invalid requests", () => {
  const result = calculatePhotoRenderPlan({ ...valid, width: 0 });
  assert.equal(result.valid, false);
  assert.equal(result.plan, null);
});
