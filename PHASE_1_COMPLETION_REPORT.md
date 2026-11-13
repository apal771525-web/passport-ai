# Architecture

## Repository shape
The repository is intentionally compact for Phase 1. It currently contains a static front-end prototype with a minimal JS rules layer rather than a full application backend.

## Front-end
- `index.html` provides the main user experience for upload, crop, export and document guidance.
- The front-end is browser-local and does not depend on a live server for basic image preparation.
- Large AI or provider features are considered unsupported unless explicitly approved and implemented.

## Safety modules
- `src/image-validation.js` validates image type and size. It blocks unsupported formats and oversized uploads.
- `src/document-rules.js` provides official-source route checks for a small selected registry.
- `src/backend-disabled-status.js` records the intentional backend-disabled state and explains the security boundary.

## Testing strategy
- Automated tests are run with Node's built-in test runner.
- Tests cover validation, route handling and disabled-state behavior.
- Browser/manual QA remains explicitly separate and must be performed on real devices.

## Security posture
- No real credentials, tokens or external API keys are present.
- The backend scaffold stays off by default.
- No biometric or identity recognition is performed.
- External AI providers remain disabled until approved.

## Release posture
This repository is not a production deployment target. It is a controlled engineering prototype and should remain behind an explicit approval gate before any external exposure.
