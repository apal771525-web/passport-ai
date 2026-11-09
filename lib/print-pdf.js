import { calculatePrintLayout } from "./print-layout.js";

function ascii(value) { return new TextEncoder().encode(value); }
function join(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

export function createPrintSheetPdf({ jpegBytes, imageWidth, imageHeight, photoWidthMm, photoHeightMm, paper = "A4" }) {
  if (!(jpegBytes instanceof Uint8Array) || jpegBytes.length < 4 ||
      jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8 ||
      jpegBytes[jpegBytes.length - 2] !== 0xff || jpegBytes[jpegBytes.length - 1] !== 0xd9) {
    throw new TypeError("A complete JPEG image is required.");
  }
  if (!Number.isInteger(imageWidth) || !Number.isInteger(imageHeight) || imageWidth < 1 || imageHeight < 1) {
    throw new RangeError("Invalid source image dimensions.");
  }
  const layout = calculatePrintLayout({ photoWidthMm, photoHeightMm, paper });
  const commands = [];
  const mark = 3; // points, short trim marks
  const offset = 1; // points outside photo edge
  commands.push("0.35 w 0 G");
  for (const p of layout.placements) {
    commands.push("q", `${p.width.toFixed(3)} 0 0 ${p.height.toFixed(3)} ${p.x.toFixed(3)} ${p.y.toFixed(3)} cm`, "/Im0 Do", "Q");
    const x1=p.x, y1=p.y, x2=p.x+p.width, y2=p.y+p.height;
    // Corner crop marks sit outside the photo, leaving the image itself untouched.
    commands.push(
      ` ${(x1-offset-mark).toFixed(3)} ${y1.toFixed(3)} m ${(x1-offset).toFixed(3)} ${y1.toFixed(3)} l`,
      ` ${x1.toFixed(3)} ${(y1-offset-mark).toFixed(3)} m ${x1.toFixed(3)} ${(y1-offset).toFixed(3)} l`,
      ` ${(x2+offset).toFixed(3)} ${y1.toFixed(3)} m ${(x2+offset+mark).toFixed(3)} ${y1.toFixed(3)} l`,
      ` ${x2.toFixed(3)} ${(y1-offset-mark).toFixed(3)} m ${x2.toFixed(3)} ${(y1-offset).toFixed(3)} l`,
      ` ${(x1-offset-mark).toFixed(3)} ${y2.toFixed(3)} m ${(x1-offset).toFixed(3)} ${y2.toFixed(3)} l`,
      ` ${x1.toFixed(3)} ${(y2+offset).toFixed(3)} m ${x1.toFixed(3)} ${(y2+offset+mark).toFixed(3)} l`,
      ` ${(x2+offset).toFixed(3)} ${y2.toFixed(3)} m ${(x2+offset+mark).toFixed(3)} ${y2.toFixed(3)} l`,
      ` ${x2.toFixed(3)} ${(y2+offset).toFixed(3)} m ${x2.toFixed(3)} ${(y2+offset+mark).toFixed(3)} l`
    );
  }
  commands.push("S");
  const stream = ascii(commands.join("\n") + "\n");
  const objects = [
    ascii("<< /Type /Catalog /Pages 2 0 R >>"),
    ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${layout.pageWidthPt.toFixed(3)} ${layout.pageHeightPt.toFixed(3)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`),
    join([ascii(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`), jpegBytes, ascii("\nendstream")]),
    join([ascii(`<< /Length ${stream.length} >>\nstream\n`), stream, ascii("endstream")])
  ];
  const parts = [ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = [0];
  let position = parts[0].length;
  for (let i=0; i<objects.length; i++) {
    offsets.push(position);
    const chunk = join([ascii(`${i+1} 0 obj\n`), objects[i], ascii("\nendobj\n")]);
    parts.push(chunk); position += chunk.length;
  }
  const xrefOffset = position;
  let xref = `xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for (let i=1; i<offsets.length; i++) xref += String(offsets[i]).padStart(10,"0") + " 00000 n \n";
  xref += `trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  parts.push(ascii(xref));
  return join(parts);
}
