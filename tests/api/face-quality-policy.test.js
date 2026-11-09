import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFacePhotoQuality as evaluate } from "../../lib/face-quality-policy.js";

const good = {
  faceCount: 1,
  faceBox: { x: 0.36, y: 0.18, width: 0.28, height: 0.48 },
  sharpnessScore: 0.9,
  brightnessScore: 0.55,
  clippingRatio: 0.01,
  backgroundUniformityScore: 0.92,
};

test("rejects missing or malformed analyzer result", () => {
  assert.equal(evaluate(null).status, "invalid_input");
  assert.equal(evaluate({ faceCount: 1 }).status, "invalid_input");
  assert.equal(evaluate({ faceCount: -1 }).status, "invalid_input");
});
test("flags no face and multiple faces", () => {
  assert.ok(evaluate({ faceCount: 0 }).issues.includes("no_face_detected"));
  assert.ok(evaluate({ faceCount: 2 }).issues.includes("multiple_faces_detected"));
});
test("one well-framed face passes advisory heuristics", () => {
  const result = evaluate(good);
  assert.equal(result.status, "advisory_checks_passed");
  assert.equal(result.advisoryOnly, true);
  assert.equal(result.canCertifyOfficialCompliance, false);
});
test("flags off-center and undersized face", () => {
  const result = evaluate({ ...good, faceBox: { x: 0.02, y: 0.1, width: 0.12, height: 0.3 } });
  assert.ok(result.issues.includes("face_may_be_too_small"));
  assert.ok(result.issues.includes("face_may_be_off_center"));
});
test("flags blur, darkness, overexposure, clipping and uneven background", () => {
  const dark = evaluate({ ...good, sharpnessScore: 0.1, brightnessScore: 0.1, clippingRatio: 0.2, backgroundUniformityScore: 0.2 });
  assert.ok(dark.issues.includes("possible_blur"));
  assert.ok(dark.issues.includes("possibly_too_dark"));
  assert.ok(dark.issues.includes("highlight_or_shadow_clipping"));
  assert.ok(dark.issues.includes("background_may_be_uneven"));
  const bright = evaluate({ ...good, brightnessScore: 0.95 });
  assert.ok(bright.issues.includes("possibly_overexposed"));
});
test("marks unavailable analyzer metrics as not assessed", () => {
  const result = evaluate({ faceCount: 0 });
  assert.ok(result.issues.includes("sharpness_not_assessed"));
  assert.ok(result.issues.includes("exposure_not_assessed"));
  assert.ok(result.issues.includes("background_not_assessed"));
});
test("rejects out-of-range metrics and invalid boxes", () => {
  assert.equal(evaluate({ ...good, sharpnessScore: 1.2 }).status, "invalid_input");
  assert.equal(evaluate({ ...good, faceBox: { x: 0.9, y: 0, width: 0.2, height: 0.4 } }).status, "invalid_input");
});
test("supports configurable advisory thresholds", () => {
  const result = evaluate(good, { thresholds: { minSharpness: 0.95 } });
  assert.ok(result.issues.includes("possible_blur"));
});
test("never modifies or crops the supplied analysis", () => {
  const before = structuredClone(good);
  evaluate(good);
  assert.deepEqual(good, before);
});
