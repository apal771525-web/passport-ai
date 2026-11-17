# Architecture Overview

## Current shape

Passport AI is currently a browser-first prototype, not a complete production web platform.

- `index.html`: monolithic page containing the primary UI and much of the client-side workflow.
- `src/image-validation.js`: standalone image metadata/type/size validation helpers.
- `src/document-rules.js`: standalone country/document requirements registry.
- `src/backend-disabled-status.js`: explicit statement that a production backend is not enabled.
- `tests/phase1-review.test.js`: Node test coverage for selected helper functions.

The helper modules are not yet wired into every UI path. The HTML UI and registry can therefore diverge.

## Runtime and data flow

The intended current workflow is browser-side photo selection, preview, positioning and export. Optional MediaPipe scripts/models may be downloaded from external hosts when their feature is invoked. “Local image processing” does not mean the page makes no network requests.

No production API, authentication service, database, object storage, durable upload flow or external image provider is configured in this repository snapshot.

## Intended future boundaries

1. Frontend: accessible document selection, photo editor, clear policy warnings and exports.
2. Requirements service: versioned, exact country/document route IDs backed by official sources and verification dates.
3. Backend: authentication, authorization, short-lived upload intents, validation and rate limiting.
4. Storage: private, time-limited storage only where necessary, with documented deletion.
5. Providers: explicitly approved image-processing adapters with informed consent and strict data minimization.

## Safety constraints

- Unsupported document routes must fail closed.
- Do not infer requirements from country alone; the exact document and application channel matter.
- Do not alter photos for routes whose authority requires an unaltered image.
- Never promise government acceptance.
- Keep backend and external provider integrations disabled until separately reviewed and approved.

## Quality gates

Run `node --test` and verify the result against the exact commit. Complete browser/device, accessibility, privacy and security reviews before production release.
