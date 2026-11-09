import test from "node:test";
import assert from "node:assert/strict";
import { getPrintPreset, validatePrintDimensions, millimetresToPixels } from "../../lib/print-presets.js";
import { calculatePrintLayout } from "../../lib/print-layout.js";

test("India under-four print preset is exactly 35 × 45 mm", () => {
  const preset=getPrintPreset("India","passport-minor-under4");
  assert.equal(preset.preferredWidthMm,35);
  assert.equal(preset.preferredHeightMm,45);
  assert.equal(validatePrintDimensions(35,45,preset).valid,true);
  assert.equal(validatePrintDimensions(36,45,preset).reason,"outside_official_range");
});

test("Australia print preset accepts only published physical-size ranges", () => {
  const preset=getPrintPreset("Australia","passport-paper");
  assert.equal(validatePrintDimensions(35,45,preset).valid,true);
  assert.equal(validatePrintDimensions(40,50,preset).valid,true);
  assert.equal(validatePrintDimensions(34,45,preset).valid,false);
  assert.equal(validatePrintDimensions(35,51,preset).valid,false);
});

test("DPI conversion is explicit and rounds to whole pixels", () => {
  assert.equal(millimetresToPixels(35,300),413);
  assert.equal(millimetresToPixels(45,300),531);
  assert.equal(millimetresToPixels(35,600),827);
  assert.throws(()=>millimetresToPixels(35,96),/300 or 600 DPI/);
});

test("A4 35 × 45 mm print sheet has a centred multi-photo layout", () => {
  const result=calculatePrintLayout({photoWidthMm:35,photoHeightMm:45,paper:"A4"});
  assert.equal(result.paper,"A4");
  assert.equal(result.count,25);
  assert.equal(result.rows,5);
  assert.equal(result.columns,5);
  assert.ok(result.placements.every(p=>p.x>=0 && p.y>=0));
});

test("Letter sheet uses exact physical page dimensions and fits square photos", () => {
  const result=calculatePrintLayout({photoWidthMm:50.8,photoHeightMm:50.8,paper:"Letter"});
  assert.equal(result.pageWidthPt,612);
  assert.equal(result.pageHeightPt,792);
  assert.ok(result.count>0);
});

test("invalid and oversized print layouts are rejected", () => {
  assert.throws(()=>calculatePrintLayout({photoWidthMm:0,photoHeightMm:45}),/Invalid/);
  assert.throws(()=>calculatePrintLayout({photoWidthMm:300,photoHeightMm:300}),/does not fit/);
  assert.throws(()=>calculatePrintLayout({photoWidthMm:35,photoHeightMm:45,paper:"Legal"}),/Unsupported/);
});

