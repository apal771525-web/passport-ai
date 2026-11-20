import test from "node:test";
import assert from "node:assert/strict";
import { suggestFaceCentering } from "../src/face-centering.js";

const request = { sourceWidth: 1200, sourceHeight: 1600, width: 413, height: 531, zoom: 1 };
test("suggests neutral crop for a face at image centre", () => {
  const result = suggestFaceCentering(request, { originX: 500, originY: 650, width: 200, height: 300 });
  assert.equal(result.valid, true);
  assert.equal(result.horizontal, 0);
  assert.equal(result.vertical, 0);
});
test("moves crop window toward an off-centre face", () => {
  const result = suggestFaceCentering(request, { originX: 800, originY: 900, width: 180, height: 260 });
  assert.equal(result.valid, true);
  assert.ok(result.horizontal > 0);
  assert.ok(result.vertical > 0);
});
test("clamps suggestions to source image boundaries", () => {
  const result = suggestFaceCentering(request, { originX: 0, originY: 0, width: 150, height: 200 });
  assert.equal(result.horizontal, -100);
  assert.equal(result.vertical, -100);
});
test("rejects invalid face geometry", () => {
  assert.equal(suggestFaceCentering(request, { originX: 1190, originY: 0, width: 30, height: 20 }).valid, false);
});
