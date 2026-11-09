# Physical photo sizing and print sheets

## Supported route presets

- India passport photo for a child below 4: 35 × 45 mm. The UI locks the physical size to the listed dimensions.
- Australia passport print: 35–40 mm wide × 45–50 mm high. The UI starts at 35 × 45 mm and lets the user choose within the published range. The face-height requirement still needs a human framing check; this tool does not measure or certify it.
- United States paper passport, United Kingdom printed passport, and Canada printed passport remain blocked for edited exports because their official rules require unaltered photos or professional capture/printing. No print sheet can bypass that block.
- Unknown routes have no inferred official size. The Custom photo route allows 20–100 mm dimensions for personal/non-official use and clearly makes no compliance claim.

## DPI and pixel conversion

The user must explicitly choose 300 or 600 DPI. Pixel dimensions are rounded from `millimetres × DPI ÷ 25.4`. For example, 35 × 45 mm at 300 DPI becomes approximately 413 × 531 pixels; at 600 DPI it becomes approximately 827 × 1063 pixels. The selected physical dimensions—not a guessed DPI tag—are embedded into the PDF page layout.

## Print-ready PDF

- Supports A4 (210 × 297 mm) and US Letter (8.5 × 11 inches), portrait orientation.
- Calculates a centred grid with 8 mm outer margin and 4 mm spacing, then draws repeated copies at the exact physical size.
- Adds small trim/crop marks outside the photo edges.
- Uses the generated photo locally in the browser; the PDF is assembled client-side without a PDF service or image upload.
- The PDF contains one page. The number of copies depends on photo size and selected paper.

## Printer instructions and limitations

Print on the paper size selected in PassportAI. In the print dialog choose `Actual size` or `100%`; disable `Fit to page`, `Shrink`, borderless enlargement, and other scaling. Measure a printed photo with a ruler before relying on it. Printer drivers, print-shop settings, paper feed, and physical tolerances can still change dimensions.

PDF physical page geometry is exact in points. The source photo raster is generated at the selected 300/600 DPI, but the tool cannot control the printer's actual output resolution or guarantee government acceptance. Face position, head height, background, expression, and any route-specific criteria still require manual review.

## Privacy

Photo processing, JPEG encoding, and PDF generation occur in the browser. This feature does not upload the image to PassportAI or call a third-party PDF service.