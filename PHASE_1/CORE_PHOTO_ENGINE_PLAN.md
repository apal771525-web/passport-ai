# PassportAI — Phase 1 Core Photo Engine

**Status:** Implementation planning only  
**Branch:** `phase-1-core-photo-engine`  
**Base:** `main`  
**Scope:** Define the safe, testable core photo-processing engine before application-code implementation.

## 1. Phase 1 objective

Build a browser-first photo pipeline that preserves the user's original image, applies only transformations permitted by a verified document-route policy, and produces deterministic outputs with clear provenance. The engine must never claim that an image is officially compliant merely because it passed technical checks.

## 2. Non-negotiable safety principles

1. Keep the original file immutable. Every edit operates on a derived working copy; provide a way to restart from the original.
2. Fail closed. Unknown, ambiguous, expired, unsupported, or unverified routes cannot produce an official-route export.
3. Enforce policy inside the processing/export layer, not only by hiding UI controls.
4. Do not beautify, reshape facial features, synthesize facial details, or silently alter identity.
5. Do not upload image bytes by default. Browser processing remains local unless a separately approved, disclosed server workflow is designed.
6. Do not log image bytes, base64, EXIF/GPS, face landmarks, embeddings, or other sensitive image-derived data.
7. Separate technical validation from official-rule verification. A technically valid file is not proof of government acceptance.

## 3. Proposed pipeline

1. **Input intake:** accept an explicit allowlist of raster formats; enforce byte and pixel limits before expensive work.
2. **Safe decode:** decode with browser APIs; reject malformed, unsupported, oversized, or decompression-risk inputs. Define decoder failure behaviour.
3. **Metadata handling:** inspect orientation for correct display; do not expose or log EXIF/GPS. Strip metadata from derived exports unless a verified route requires otherwise.
4. **Route resolution:** resolve a versioned route key using jurisdiction, issuing authority/mission, document, application channel, applicant category when relevant, and output type.
5. **Policy decision:** obtain a reviewed policy record with source, reviewer, verification date, status, and an explicit allowlist of operations.
6. **Edit planning:** construct an operation plan only from the policy allowlist. No implicit defaults for unknown routes.
7. **Preview:** show the user the original and proposed result; clearly label advisory checks and any unverified route.
8. **Export gate:** re-check the route-policy version and each requested operation at export time. Reject stale or prohibited plans.
9. **Output validation:** verify dimensions, format, aspect ratio and file-size constraints only when those values are sourced and verified for the exact route.
10. **Delivery:** export a derived file with a concise record of applied operations and policy version; retain no server copy in the browser-only workflow.

## 4. Shared route-policy contract

Each route record must define:

- Stable route ID and policy version.
- Country/jurisdiction and issuing authority or mission.
- Document type, application channel, applicant category if relevant, and digital/printed output.
- Status: `verified`, `needs_review`, `unsupported`, `expired`, or `retired`.
- Official source URL/title, reviewer, last-verified date, effective date where known, and next-review date.
- Explicit operation permissions: crop, rotate, resize, background replacement, colour/exposure adjustment, retouching, compression/re-encoding, and print layout.
- Exact output constraints only when verified: pixel/mm dimensions, aspect ratio, format, file-size limits, and print/DPI requirements.
- User-facing explanation and fallback instructions when no official export is permitted.

A missing field, absent source, expired verification, or unresolved policy conflict must result in a no-edit/no-official-export decision.

## 5. Engine module boundaries

Suggested boundaries (names are provisional):

- `image-intake`: file type, byte limit and pixel-limit checks.
- `safe-decode`: decode, orientation and failure handling.
- `route-policy`: route lookup, policy versioning and fail-closed decisions.
- `operation-planner`: creates an allowed transformation plan.
- `transform-runner`: executes only approved operations.
- `export-gate`: revalidates policy and plan immediately before export.
- `output-validator`: checks verified output constraints.
- `privacy-boundary`: ensures no image-derived sensitive values enter logs or network requests.

Do not duplicate route rules across UI components, backend helpers, or export functions. UI controls should consume the same decision object as the engine.

## 6. Required test strategy

### Unit tests
- Unknown, ambiguous, unsupported and expired routes fail closed.
- Each operation is allowed or rejected according to the exact policy record.
- A stale policy version invalidates an edit plan at export.
- Original input bytes remain unchanged after repeated edits and failed exports.
- Output checks run only against route-specific verified constraints.
- Metadata stripping and orientation handling are deterministic.

### Adversarial input tests
- Spoofed MIME types and mismatched file signatures.
- Truncated, malformed and unusually large images.
- Excessive pixel dimensions and decompression/resource exhaustion cases.
- Transparent images, unusual colour profiles and EXIF orientation variants.
- Corrupt or missing segmentation masks; model/CDN unavailable; repeated processing.
- Inputs with GPS/EXIF metadata; verify it is not logged or unintentionally retained.

### Browser and device tests
- Current desktop browsers and mobile Safari/Chrome.
- Low-memory Android devices and large camera images.
- Slow/offline networks, model-load failure and browser tab interruption.
- Keyboard accessibility, touch crop controls and screen-reader labels.

### Route regression tests
Add positive and negative tests only after each route's current official instructions have been independently sourced and reviewed. Initially treat US passport, US visa, UK visa, Canada passport, Schengen and Australia routes as policy-review cases; do not infer permissions from dimensions or another country's rules.

## 7. Phase 1 milestones

- **P1-A — Contract:** approve route-policy schema, operation vocabulary and fail-closed decision model.
- **P1-B — Intake/decode:** implement and test safe local image intake and decoding.
- **P1-C — Policy engine:** implement route resolution, version checks and operation authorization.
- **P1-D — Transform pipeline:** implement only the operations explicitly authorized by test policies.
- **P1-E — Export gate:** enforce policy again at export and validate outputs.
- **P1-F — Browser QA:** run adversarial, regression, accessibility and low-memory device tests.
- **P1-G — Review:** independent privacy/compliance review; no merge or deployment without separate approval.

## 8. Definition of done

- Original image remains recoverable and unmodified.
- Every transformation is authorized by a current, reviewed route policy.
- Unknown or expired routes cannot generate an official-route output.
- Policy is enforced in the engine and at export, not only in the UI.
- No image data or sensitive image-derived data is sent to a server in the local-only workflow.
- Unit, adversarial, route regression and browser tests pass on the exact proposed commit.
- User-facing language distinguishes technical checks from official acceptance.
- Independent review is complete and all unresolved risks are documented.

## 9. Explicit exclusions

This planning document does not authorize changing application code, enabling an external AI provider, uploading user photos, configuring authentication/storage, changing GitHub settings, modifying PR #5/#6/#8, merging, or deploying. Those actions require separate approval after the relevant design and risks are reviewed.
