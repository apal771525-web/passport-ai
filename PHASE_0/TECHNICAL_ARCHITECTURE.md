# Passport AI — Technical Architecture Proposal

**Status:** Proposed architecture; not yet selected or implemented.

## 1. Existing baseline

The inspected main branch is a lightweight HTML-first prototype. It does not yet establish a production-grade application architecture. Existing repository tests are not a substitute for end-to-end browser/device tests.

## 2. Architecture principles

- Keep the image-processing path local to the user's device whenever feasible.
- Separate UI, document rules, image validation, image transformations, and export logic.
- Treat country requirements as versioned data, not scattered UI conditionals.
- Use typed contracts and deterministic tests around image and rule logic.
- Keep secrets server-side; never place provider credentials in browser code or repository files.
- Avoid uploading image files unless a feature requires it and the user has explicitly consented.
- Design graceful fallbacks for unsupported browsers and routes.

## 3. Proposed logical components

1. Web application: route selection, guided capture, editor, results, export.
2. Image pipeline: decode, validate, crop, transform, encode, print layout.
3. Quality-assistance module: framing, blur, exposure, background analysis.
4. Compliance registry: jurisdiction, document, application route, requirements, source metadata, version.
5. Optional API: account operations, billing, and carefully scoped server-side tasks.
6. Data layer: minimal account and transaction data only if accounts/payments are approved.
7. Observability: privacy-safe operational metrics and error reporting.

## 4. Technology candidates

| Layer | Candidate | Decision status |
|---|---|---|
| Web framework | Next.js + TypeScript | Candidate, not approved |
| UI styling | Tailwind CSS + accessible components | Candidate |
| Image processing | Browser APIs, Canvas, Web Workers | Candidate |
| Face/framing assistance | MediaPipe or equivalent | Requires privacy, licensing, performance review |
| API | Next.js route handlers or separate service | Not selected |
| Database | PostgreSQL | Only if persistence is justified |
| Object storage | Cloudflare R2 or equivalent | Only if server-side file storage is justified |
| Hosting | Existing Vercel integration | Current projects need consolidation decision |
| Testing | Node tests + browser E2E (e.g. Playwright) | Proposed |
| Monitoring | Privacy-safe error and performance monitoring | To be selected |

## 5. Image pipeline requirements

- Validate file size and allowed formats before processing.
- Inspect file signatures where possible; do not trust browser-supplied MIME metadata alone.
- Decode images safely and enforce pixel/dimension limits to reduce decompression/resource-exhaustion risk.
- Normalize orientation carefully and avoid leaking EXIF/GPS metadata in exported files unless explicitly required.
- Keep original bytes unchanged when a route requires an unaltered original.
- Apply only transformations permitted by the selected route.
- Re-encode output deterministically and test dimensions, file size, format, and print resolution.
- Do not claim a technical quality check proves official acceptance.

## 6. Compliance rules data model

Each rule record should include:
- Jurisdiction and issuing authority.
- Document type and application route.
- Applicant category (e.g. adult/child) where relevant.
- Output type (digital/printed).
- Required dimensions, file type, size, background, framing, and other applicable constraints.
- Alteration policy.
- Official source URL and source title.
- Effective date if stated, last verified date, rule version, reviewer, and test cases.
- Status: draft, verified, needs-review, or retired.

A rule must not be marked verified without an official source and a reproducible test/review record.

## 7. Hosting and environments

- Keep GitHub as source of truth.
- Use a dedicated development/review branch and Preview deployments for validation.
- Keep the production branch set to `main` unless the founder approves a deliberate change.
- Two Vercel projects currently appear connected to the same repository. Do not delete either until domains, deployment history, environment variables, access controls, and intended canonical URL are confirmed.
- No production deployment or project setting change is part of Phase 0.

## 8. Engineering quality gates

- Unit tests for validation, crop geometry, export dimensions, and rule evaluation.
- Integration tests for upload-to-export flows.
- Browser E2E tests on desktop and mobile viewports.
- Accessibility checks for keyboard, labels, contrast, focus, and screen readers.
- Performance tests for large images and low-memory mobile devices.
- Dependency and secret scanning.
- Privacy/security review before enabling server uploads or accounts.
