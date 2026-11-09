# Face Detection & Photo Quality Engine — Blueprint

## Purpose
A technical framing and capture-quality advisory only. This module consumes normalized measurements from a trusted analyzer; it does not detect identity, recognize or match faces, infer age/gender/emotion, create embeddings, or store biometric templates.

## Privacy-first architecture
- Prefer an on-device/browser analyzer so the original portrait stays on the user's device.
- If a later server analyzer is considered, require explicit, informed consent and a separate privacy/security review first.
- The analyzer adapter must return only: face count, normalized face bounding box, sharpness, exposure, clipping and background-uniformity scores.
- Do not persist images, face boxes, scores, embeddings or analyzer output by default.
- No detector dependency, external API, API key, endpoint wiring or UI integration is added by this blueprint.

## Policy contract
`evaluateFacePhotoQuality(analysis, options?)` validates normalized analyzer output and returns advisory issue codes and retake suggestions. Scores are expected in the 0–1 range. The initial defaults in code are configurable engineering heuristics, not passport standards and not validated against any government authority.

A single face requires a normalized box with x/y/width/height in the 0–1 image coordinate space. Optional quality metrics omitted by the analyzer are reported as "not assessed", never treated as passed.

## Important limitations
- A face detector can miss faces or return inaccurate boxes; results must be presented as suggestions, not a pass/fail certification.
- Document requirements differ by country, visa type, issuing authority, print/digital submission and current revision. A separate verified rules registry is required before country-specific guidance.
- The engine does not crop, retouch, alter facial features, remove glasses, regenerate pixels or guarantee official acceptance.
- The unit tests validate policy logic only. They do not measure detector accuracy, image quality or government acceptance.

## Activation boundary
This is an isolated library contract and test suite on the existing draft PR branch. It is not connected to the upload endpoint, browser UI, production branch or deployment. No image is transmitted and no paid service is used.
