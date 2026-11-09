import test from "node:test";
import assert from "node:assert/strict";
import { createPrintSheetPdf } from "../../lib/print-pdf.js";

test("creates a PDF with an exact A4 page box and repeated JPEG photo placements", () => {
  const pdf=createPrintSheetPdf({
    jpegBytes:new Uint8Array([0xff,0xd8,0xff,0xd9]),
    imageWidth:413,imageHeight:531,photoWidthMm:35,photoHeightMm:45,paper:"A4"
  });
  const header=new TextDecoder().decode(pdf.slice(0,8));
  const text=new TextDecoder().decode(pdf);
  assert.equal(header,"%PDF-1.4");
  assert.match(text,/\/MediaBox \[0 0 595\.276 841\.890\]/);
  assert.match(text,/\/Subtype \/Image/);
  assert.match(text,/\/Filter \/DCTDecode/);
  assert.match(text,/%%EOF/);
});

test("rejects invalid JPEG bytes and unsupported paper sizes", () => {
  assert.throws(()=>createPrintSheetPdf({
    jpegBytes:new Uint8Array([1,2,3,4]),imageWidth:100,imageHeight:100,
    photoWidthMm:35,photoHeightMm:45
  }),/complete JPEG/);
  assert.throws(()=>createPrintSheetPdf({
    jpegBytes:new Uint8Array([0xff,0xd8,0xff,0xd9]),imageWidth:100,imageHeight:100,
    photoWidthMm:35,photoHeightMm:45,paper:"Legal"
  }),/Unsupported paper/);
});
