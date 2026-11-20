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
test("moves a landscape crop horizontally toward an off-centre face", () => {
  const landscape = { ...request, sourceWidth: 1600, sourceHeight: 1200 };
  const result = suggestFaceCentering(landscape, { originX: 800, originY: 450, width: 180, height: 260 });
  assert.equal(result.valid, true);
  assert.ok(result.horizontal > 0);
  assert.equal(result.vertical, 0);
});
test("moves a portrait crop vertically toward a lower face", () => {
  const result = suggestFaceCentering(request, { originX: 500, originY: 1000, width: 180, height: 260 });
  assert.equal(result.valid, true);
  assert.equal(result.horizontal, 0);
  assert.ok(result.vertical > 0);
});
test("clamps a portrait crop to the top source boundary", () => {
  const result = suggestFaceCentering(request, { originX: 0, originY: 0, width: 150, height: 200 });
  assert.equal(result.horizontal, 0);
  assert.equal(result.vertical, -100);
});
test("clamps a landscape crop to the left source boundary", () => {
  const landscape = { ...request, sourceWidth: 1600, sourceHeight: 1200 };
  const result = suggestFaceCentering(landscape, { originX: 0, originY: 0, width: 150, height: 200 });
  assert.equal(result.horizontal, -100);
  assert.equal(result.vertical, 0);
});
test("rejects invalid face geometry", () => {
  assert.equal(suggestFaceCentering(request, { originX: 1190, originY: 0, width: 30, height: 20 }).valid, false);
});
