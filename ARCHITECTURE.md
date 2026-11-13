# Passport AI

Passport AI is a static, browser-first photo preparation prototype for passport, visa and ID-style photo workflows. The repository currently contains a single HTML entry point and a small validation/rules layer for safer, testable Phase 1 work.

Status: PARTIALLY COMPLETE

What is implemented
- Single-page photo editor UI in `index.html`.
- Local-only image validation and safety checks.
- A minimal country/document requirements registry for key routes.
- Backend scaffold explicitly disabled by design.
- Automated tests for validation, unsupported routes and backend-disabled state.

What is not yet production-ready
- There is no live backend, production auth, external provider integration, or durable storage.
- No browser/device QA has been performed in this environment.
- No external AI provider or paid image-processing service is configured.
- No government acceptance guarantee is made.

Phase 1 emphasis
- Preserve working front-end behaviors.
- Keep the backend disabled until secure provider approval exists.
- Validate file types and sizes.
- Make route handling explicit and fail closed when sources are unsupported.
- Prepare accurate documentation and test coverage.

Repository posture
- This branch is `phase-1-review`.
- No direct changes were made to `main`.
- No deployment, merge, or external publication occurred.

Testing
- Run: `node --test`

Key files
- `index.html` — main UI.
- `src/image-validation.js` — upload validation and image checks.
- `src/document-rules.js` — country/document requirements registry.
- `src/backend-disabled-status.js` — explicit disabled backend status.
- `tests/` — automated tests.
