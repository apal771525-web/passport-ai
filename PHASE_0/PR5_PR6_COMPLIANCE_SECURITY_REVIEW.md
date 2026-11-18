# PassportAI — PR #5 / PR #6 Compliance and Security Review

**Status:** Phase 0 planning review; recommendations only.  
**Reviewed:** 2026-11-19  
**Repository:** `apal771525-web/passport-ai`  
**Review branches:** `feature/ai-background-removal` (PR #5) and `backend-blueprint-no-api-keys` (PR #6)  
**Boundary:** No application code, PR metadata, branch settings, Vercel settings, or deployments are changed by this review.

## 1. Executive decision

**Do not merge PR #5 or PR #6 in their current state.** Both remain open and GitHub reports them as not mergeable. The review identifies policy and integration issues that should be resolved and retested before either PR is reconsidered.

PR #5 is a browser-side prototype. It is not a verified global passport-photo editor. PR #6 is a deliberately disabled backend scaffold. It is not a production authentication, upload, storage, or AI-provider implementation.

The product must preserve the original photo and enforce route-specific editing restrictions in the processing layer, not only in the interface.

## 2. PR #5 — browser editor findings

Source: [PR #5](https://github.com/apal771525-web/passport-ai/pull/5)  
Head: `8d736ca018ee392272bb115384329255f74b44ae`

### Positive controls observed

- Uses browser-side MediaPipe Selfie Segmentation; the inspected page does not upload the photo to PassportAI's API.
- Does not implement face beautification or facial reshaping.
- Disables processing for the UK visa and Canadian paper-passport selections.
- Forces the original-background mode for US passport and visa selections.
- Invalidates an existing export when key inputs change.

### Release blockers / required corrections

1. **Unverified-route editing is too permissive.** The default document/country selection permits the user to invoke AI segmentation and export even when no verified route rule exists. Unknown, unsupported, and stale routes must default to a no-edit state. A user may still receive capture guidance, but must not receive an official-route export preset by inference.
2. **US passport crop/resize remains enabled.** The UI says the US passport image must be original and unedited, yet the Create Photo action can still produce a cropped/resized derivative. The route must block edited official exports unless the exact current official instructions explicitly permit that operation.
3. **US visa policy needs one authoritative decision.** PR #5 describes digital alteration as prohibited, while PR #6 has a US digital-visa preset that allows a generated JPEG. Verify the current official source and the exact visa workflow. Until reconciled, disable edited official export for this route; do not assume that keeping the original background makes a crop/resize derivative acceptable.
4. **The Schengen preset is not route-specific.** A generic 413 × 531 px value is not a safe universal digital or printed Schengen rule. Require country, issuing authority/mission, application channel, and output type; otherwise show no preset and no official export.
5. **The UI and processing layer need a shared policy gate.** Hiding or disabling controls is insufficient. The export function itself must receive a verified route policy and reject prohibited transformations.
6. **Model and device reliability are unproven.** Add browser tests for model-load failure, missing mask, transparent input, hair/edge artifacts, large images, low-memory Android devices, and repeat processing. No model output should be described as official compliance.

## 3. PR #6 — backend and privacy findings

Source: [PR #6](https://github.com/apal771525-web/passport-ai/pull/6)  
Head: `4eac87efc13afd5ca6aee0383cda48986c5f4109`

### Positive controls observed

- The background-removal endpoint is deliberately disabled and returns `503 PROVIDER_NOT_CONFIGURED`.
- No provider key or live provider call was found in the inspected endpoint.
- The endpoint sets no-store and several security headers.
- The scaffold contains separate contracts/tests for authentication, rate limiting, upload intent, image validation, output presets, and print layout.
- Face-quality policy explicitly says it is advisory and cannot certify official compliance.
- The inspected code describes local browser processing and no default image persistence.

### Release blockers / required corrections

1. **Do not enable the endpoint by adding a provider key alone.** The current endpoint does not enforce the authentication guard, durable rate limiter, or one-time upload-intent policy. These helpers are contracts, not active protections in this handler.
2. **No verified identity boundary exists yet.** Before accepting uploads, define and implement trusted authentication, authorization, CSRF/origin strategy where applicable, and abuse controls. Requests without an Origin header must not become an unauthenticated bypass for a future active endpoint.
3. **Image validation is not a hardened image decode.** Header/signature and dimensions are not equivalent to fully decoding and safely re-encoding an image. Specify decoder isolation, pixel limits, decompression/resource limits, malformed-file handling, and metadata policy.
4. **Durable controls are not configured.** The rate limiter and one-time upload intent require a real atomic durable store. Do not treat in-memory or injected test doubles as production controls.
5. **Provider privacy and retention are undecided.** Before any external processing, document the processor, region, purpose, retention, deletion, subprocessors, user consent, failure handling, and whether the original is retained. No upload should occur without explicit user-facing disclosure and consent.
6. **Route policy must govern all exports.** The current rules registry, output presets, PR #5 UI and export functions must use one shared route-policy contract. A permissive output preset must never override a rule that prohibits alteration.
7. **Australia route requires review.** The registry warns that the Australian Passport Office does not recommend online/mobile photo services and says no retouching, but the route is not marked blocked. A qualified review must decide which transformations, if any, are permissible before enabling an official export.
8. **Verification dates need lifecycle controls.** The registry has a single checked date. Add per-rule reviewer, source version/effective date where available, next-review date, status and tests. Expired or withdrawn rules must fail closed.

## 4. Required shared route-policy contract

Every selectable route should resolve to a versioned record containing:

- Country/jurisdiction and issuing authority or mission.
- Document type, application channel, applicant category where relevant, and output type (digital/printed).
- Official source URL, source title, last-verified date, reviewer, effective date if known, and rule version.
- Allowed operations: crop, rotate, resize, background replacement, colour/exposure changes, retouching, compression/re-encoding, print layout.
- Prohibited operations and required original-file behaviour.
- Exact output constraints only where verified: pixel/mm dimensions, aspect ratio, format, file-size ceiling/floor, DPI/print requirements.
- Status: `verified`, `needs_review`, `unsupported`, `expired`, or `retired`.

**Fail-closed rule:** if a route is unknown, ambiguous, expired, missing a source, or lacks a reviewed operation policy, no edited file may be labelled or exported as an official-route result. Preserve the original and explain how the user can follow the issuing authority's instructions.

## 5. Cross-PR acceptance criteria

Before either PR is considered ready:

- [ ] PR #5 and PR #6 use the same route-policy contract and rule version.
- [ ] Unsupported/unknown routes cannot use AI segmentation or official export.
- [ ] Each prohibited operation is blocked in both UI and processing/export code.
- [ ] Original source bytes remain unchanged and can be recovered.
- [ ] Route-specific tests cover allowed and prohibited operations, including negative cases.
- [ ] US passport, US visa, UK visa, Canada passport, Schengen and Australia route decisions are reconciled against current official sources.
- [ ] File validation includes real decoder behaviour, not only magic-byte tests.
- [ ] No image bytes, base64, EXIF/GPS, face landmarks, or face embeddings enter logs.
- [ ] Upload path remains disabled until authentication, authorization, durable limits, consent and retention controls are active and tested.
- [ ] Mobile browser/device tests include low-memory Android and model/CDN failure.
- [ ] PRs are rebased/resolved on their own branches and GitHub reports a clean merge state.
- [ ] CI and preview checks pass on the exact final heads; a successful older run is not sufficient.

## 6. Recommended sequence

1. **Policy first:** approve the shared route-policy schema and route decision table.
2. **PR #5 correction plan:** close the unknown-route and US-route gaps; remove generic Schengen assumptions; enforce policy at export.
3. **PR #6 hardening plan:** keep endpoint disabled; wire auth, rate limit, upload intent and robust decoding only after a concrete server-processing requirement is approved.
4. **Test strategy:** add route-policy negative tests, real image fixtures, browser E2E and Android performance checks.
5. **Independent review:** re-check official sources and privacy/security boundaries before merge consideration.

## 7. Current repository state and change control

At review time, PR #5 and PR #6 are open and unmerged. Their branches are separate from `main`; GitHub reports both as not mergeable. This document does not resolve conflicts, change code, update PRs, merge branches, or alter deployment settings.

The existing Phase 0 approval covers planning documents only. Any application-code implementation, PR review submission, merge, Vercel setting change, or deployment requires separate explicit approval.
