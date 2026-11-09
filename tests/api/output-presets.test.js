import test from "node:test";
import assert from "node:assert/strict";
import { getOutputPreset, validateOutputDimensions } from "../../lib/output-presets.js";

test("US digital visa route gets only its documented square JPEG preset", () => {
  const preset = getOutputPreset("United States", "visa-digital");
  assert.equal(preset.format, "image/jpeg");
  assert.equal(preset.preferredWidth, 600);
  assert.equal(preset.preferredHeight, 600);
  assert.equal(preset.maxBytes, 240000);
  assert.equal(validateOutputDimensions(600, 600, preset).valid, true);
  assert.equal(validateOutputDimensions(1200, 1200, preset).valid, true);
});

test("US digital visa dimensions reject out-of-range and non-square outputs", () => {
  const preset = getOutputPreset("United States", "visa-digital");
  assert.equal(validateOutputDimensions(599, 600, preset).reason, "outside_allowed_range");
  assert.equal(validateOutputDimensions(1201, 1201, preset).reason, "outside_allowed_range");
  assert.equal(validateOutputDimensions(600, 750, preset).reason, "wrong_aspect_ratio");
});

test("physical print routes do not invent pixel dimensions or DPI", () => {
  assert.equal(getOutputPreset("India", "passport-minor-under4"), null);
  assert.equal(getOutputPreset("Australia", "passport-paper"), null);
  assert.equal(getOutputPreset("Canada", "passport-paper"), null);
});

test("unknown routes do not inherit another route's preset", () => {
  assert.equal(getOutputPreset("France", "visa-digital"), null);
  assert.equal(getOutputPreset("United States", "passport-paper"), null);
  assert.equal(validateOutputDimensions(413, 531, null).valid, true);
});
