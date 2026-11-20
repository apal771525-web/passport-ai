import test from "node:test";
import assert from "node:assert/strict";
import { calculateCropWindow, moveCropWindow } from "../src/crop-drag.js";

const request = {
  sourceWidth: 1600, sourceHeight: 900, width: 600, height: 900,
  zoom: 1, horizontal: 0, vertical: 0,
};

test("calculates a centred crop window with output aspect ratio", () => {
  const crop = calculateCropWindow(request);
  assert.equal(crop.valid, true);
  assert.equal(crop.leftPercent, 31.25);
  assert.equal(crop.widthPercent, 37.5);
  assert.equal(crop.heightPercent, 100);
});

test("moves crop window in the direction of a drag", () => {
  const crop = calculateCropWindow(request);
  const displayWidth = 320, displayHeight = 180;
  const moved = moveCropWindow(request, crop.overflowX * displayWidth / request.sourceWidth / 2, 0, displayWidth, displayHeight);
  assert.equal(moved.valid, true);
  assert.equal(moved.horizontal, 100);
});

test("clamps drag movement at image boundaries", () => {
  const moved = moveCropWindow({ ...request, horizontal: 90 }, 10000, 0, 320, 180);
  assert.equal(moved.horizontal, 100);
});

test("preserves an axis when the crop has no overflow on that axis", () => {
  const square = { ...request, sourceWidth: 600, sourceHeight: 900, width: 600, height: 900, horizontal: 25 };
  const moved = moveCropWindow(square, 100, 100, 200, 300);
  assert.equal(moved.horizontal, 25);
  assert.equal(moved.vertical, 0);
});

test("rejects invalid geometry and pointer measurements", () => {
  assert.equal(calculateCropWindow({ ...request, zoom: 0 }).valid, false);
  assert.equal(moveCropWindow(request, NaN, 0, 320, 180).valid, false);
});
