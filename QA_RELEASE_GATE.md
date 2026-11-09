# PassportAI — Preview End-to-End QA and Release Gate

## Scope and safety boundary

This checklist applies only to the `backend-blueprint-no-api-keys` preview branch and PR #6. It is not evidence that the app has passed a real-device/browser test. Do not merge, publish, promote, change production environment variables, or enable paid image providers as part of QA.

## Automated checks

Run from the repository root:

```sh
node --test
```

Expected coverage includes backend disabled-state behavior, request and image validation, rate-limit/auth/upload policy contracts, face-quality policy, official document-rule lookup, output presets, physical print presets, layout calculations, and PDF structure.

A green unit suite does not establish real camera quality, browser compatibility, PDF printer accuracy, provider quality, or government acceptance.

## Mobile browser test matrix

Use a current Android Chrome browser and a separate desktop Chromium browser. Use only test images that the tester is authorized to use. Do not upload real identity documents to a third-party test service.

| ID | Scenario | Expected result |
|---|---|---|
| M01 | Open preview with no country or route selected | Create Photo remains disabled; no default/guessed official route is assumed. |
| M02 | Select a country but leave route blank | Create Photo remains disabled. |
| M03 | Select Custom photo (non-official use) | Custom workflow becomes available with a clear non-compliance warning. |
| M04 | Select US paper passport, US online renewal, UK digital/printed passport, Canada printed/online passport, or India adult PSK/POPSK | Edited photo creation and download remain blocked; original-photo warning and source link are visible. |
| M05 | Select US digital visa | Starts at 600 × 600; rejects non-square and dimensions outside 600–1200; JPG download is rejected if it remains over 240,000 bytes. |
| M06 | Select India child-under-4 print route | Fixed 35 × 45 mm size; 300/600 DPI selection controls pixel dimensions; no official acceptance guarantee. |
| M07 | Select Australia printed passport | Width 35–40 mm and height 45–50 mm; out-of-range values rejected; professional-provider warning visible. |
| M08 | Change country/route after creating a custom image | Previous canvas, download and print-sheet result are invalidated; user must create a fresh result. |
| M09 | Change physical size, DPI or paper after creating an image | Stale result is invalidated; print PDF cannot be downloaded until photo is recreated. |
| M10 | Upload unsupported MIME, corrupt image, or image larger than 15 MiB | Rejected with a clear message; previous output is not retained as downloadable. |
| M11 | Upload valid JPG, PNG and WebP test images | Preview loads; crop controls work; output matches chosen dimensions; JPG export can be opened. |
| M12 | Analyze a clear single-face test image, a no-face image and a multiple-face image | Advisory states are understandable; analysis failure is non-fatal; no identity inference or photo upload occurs. |
| M13 | Disconnect network before quality analysis | Analysis reports it could not run; image editing/export remains available where route policy allows. |
| M14 | Create A4 and Letter print sheets | PDF opens; page size is correct; photo placements and trim marks are visible; copy count/layout matches calculation. |
| M15 | Print PDF using Actual Size / 100% | Measure one printed copy with a ruler; it should match configured mm within printer tolerances. Fit-to-page must be off. |
| M16 | Switch routes repeatedly, use browser back/refresh, and re-upload | No stale output or policy bypass; no uncaught console errors. |

## Privacy and security checks

- Confirm browser DevTools Network shows no PassportAI image-upload request during local crop, quality analysis, JPG export, or PDF generation.
- Confirm no photo bytes, base64, API keys, tokens, signed URLs, or personal identifiers appear in console output or server logs.
- Confirm MediaPipe library/model are fetched only after the user explicitly taps Analyze. Their hosting providers may collect ordinary request/performance metadata.
- Confirm the backend image endpoint remains disabled and valid requests return `PROVIDER_NOT_CONFIGURED`.
- Confirm no provider API key, paid provider, storage bucket, durable rate-limit service, authentication provider, or user database is configured.
- Confirm no face embeddings, face matching, identity recognition, age/gender/emotion inference, or biometric-template persistence is present.

## Document-policy checks

- Verify every displayed source link opens the exact issuing authority page/PDF.
- Verify source-checked date is visible and re-check official sources immediately before any public release.
- Unknown country/route combinations must never inherit another route's rules.
- Original/unaltered-photo routes must stay blocked from edited export.
- A route marked as supported is not an acceptance guarantee. Check head size, pose, expression, lighting, background, recency and category-specific rules against the issuing authority.
- Do not expand country coverage using unofficial blogs or guessed dimensions.

## Print/PDF checks

- Pixel conversion uses the explicitly selected DPI only: `round(mm × DPI / 25.4)`.
- The PDF page MediaBox must match A4 or US Letter points exactly.
- The photo image must be embedded as JPEG and placed at the requested physical mm dimensions.
- Crop marks must sit outside the photo image and must not overlap adjacent photos.
- Validate print dimensions using a physical ruler; PDF metadata alone cannot guarantee printer output size.
- Do not describe DPI as a property guaranteed by the PDF printer; physical placement is determined by the PDF page geometry and print scaling.

## Known limitations / release blockers

1. No real browser automation or Android-device run has been performed by this checklist alone.
2. The face detector/model is downloaded from external hosting; network availability and device performance vary.
3. Face/photo quality thresholds are advisory heuristics, not certified passport-photo rules.
4. The background-removal API is deliberately disabled; this branch is not a production-quality background remover.
5. Authentication, durable rate limiting, private object storage, hardened full image decoding, malware scanning, quotas, monitoring, and provider integration are not activated.
6. The output canvas currently provides crop/resize/background fill; it does not certify biometric framing or authority acceptance.
7. PDF physical sizing must be verified on the actual printer with scaling set to 100%.
8. The current country registry is limited to listed routes only and needs periodic official-source review.

## Release decision

Do not mark this project production-ready until all automated tests pass, the mobile and desktop matrix is executed and recorded, privacy/security checks are independently reviewed, official sources are revalidated, accessibility and performance are tested, and the user explicitly approves any production deployment or paid-provider activation.
