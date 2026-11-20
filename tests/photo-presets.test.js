import test from "node:test";
import assert from "node:assert/strict";
import { PHOTO_PRESETS, millimetresToPixels, customDimensionsToPixels } from "../src/photo-presets.js";
test("includes common size presets",()=>{assert.equal(PHOTO_PRESETS["india-35x45"].widthMm,35);assert.equal(PHOTO_PRESETS["canada-50x70"].heightMm,70);assert.equal(PHOTO_PRESETS["square-2x2"].widthMm,50.8);});
test("converts mm to pixels at 300 DPI",()=>{assert.equal(millimetresToPixels(35,300),413);assert.equal(millimetresToPixels(45,300),531);});
test("converts cm and inch dimensions",()=>{assert.deepEqual(customDimensionsToPixels(3.5,4.5,"cm",300),{width:413,height:531});assert.deepEqual(customDimensionsToPixels(2,2,"inch",300),{width:600,height:600});});
test("accepts direct pixels",()=>{assert.deepEqual(customDimensionsToPixels(600,900,"px"),{width:600,height:900});});
test("rejects invalid values",()=>{assert.throws(()=>millimetresToPixels(0,300),/positive/);assert.throws(()=>millimetresToPixels(35,0),/DPI/);assert.throws(()=>customDimensionsToPixels(3,4,"yard"),/mm, cm, inch or px/);});
