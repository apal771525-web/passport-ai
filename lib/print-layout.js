const PAPER = Object.freeze({
  A4: Object.freeze({ widthPt: 595.2756, heightPt: 841.8898 }),
  Letter: Object.freeze({ widthPt: 612, heightPt: 792 })
});
const MM_TO_PT = 72 / 25.4;

export function calculatePrintLayout({ photoWidthMm, photoHeightMm, paper = "A4", marginMm = 8, gapMm = 4 }) {
  const page = PAPER[paper];
  if (!page) throw new RangeError("Unsupported paper size.");
  if (![photoWidthMm, photoHeightMm, marginMm, gapMm].every(Number.isFinite) ||
      photoWidthMm <= 0 || photoHeightMm <= 0 || marginMm < 0 || gapMm < 0) {
    throw new RangeError("Invalid print layout measurements.");
  }
  const photoW = photoWidthMm * MM_TO_PT, photoH = photoHeightMm * MM_TO_PT;
  const margin = marginMm * MM_TO_PT, gap = gapMm * MM_TO_PT;
  const columns = Math.floor((page.widthPt - 2 * margin + gap) / (photoW + gap));
  const rows = Math.floor((page.heightPt - 2 * margin + gap) / (photoH + gap));
  if (columns < 1 || rows < 1) throw new RangeError("This photo size does not fit on the selected paper.");
  const gridW = columns * photoW + (columns - 1) * gap;
  const gridH = rows * photoH + (rows - 1) * gap;
  const startX = (page.widthPt - gridW) / 2;
  const startY = (page.heightPt - gridH) / 2;
  const placements = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      placements.push({
        x: startX + column * (photoW + gap),
        y: page.heightPt - startY - photoH - row * (photoH + gap),
        width: photoW,
        height: photoH
      });
    }
  }
  return { paper, pageWidthPt: page.widthPt, pageHeightPt: page.heightPt, rows, columns, count: placements.length, placements };
}

export const PRINT_PAPER_SIZES = Object.freeze(Object.keys(PAPER));
