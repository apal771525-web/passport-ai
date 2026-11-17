# Passport AI

**Tagline:** Your Identity. Perfectly Framed.

Passport AI is a browser-first prototype for preparing passport, visa and ID-style photos. The long-term product goal is a secure, mobile-first global service with country- and document-specific guidance.

## Current repository status

**Prototype / not production-ready.** The main user interface is in `index.html`. Small JavaScript helper modules and a Node test file are also present under `src/` and `tests/`.

The helper modules are not yet integrated into every corresponding UI workflow. Country requirements need route-by-route verification against current official government sources before being presented as authoritative.

## Current capabilities to verify in a real browser

- Document and country selection UI.
- Local photo selection, preview, crop/position controls and image export.
- Optional browser-side MediaPipe functionality loaded from external hosts.
- Print-sheet workflow.

These are code-level observations, not a claim that every feature has passed device QA.

## Not implemented / not verified

- Production backend, user accounts or authentication.
- Database or durable photo storage.
- Production image-processing provider.
- Payments, subscriptions or admin dashboard.
- Completed Android/iOS, accessibility, printer or cross-browser QA.
- Government acceptance or certification.

## Privacy and safety

Passport and identity photos are sensitive. Keep processing local where possible, minimize retention, never log image bytes, and do not send photos to third parties or use them for model training without explicit, informed consent. Do not claim guaranteed government acceptance. Some authorities prohibit retouching or alteration.

## Development

Requirements: Node.js (for tests).

```sh
node --test
```

A test file exists, but test results must be run and recorded against the exact commit before being called passing.

## Repository workflow

- Treat `main` as the stable integration branch.
- Branch protection is not confirmed by this README; repository administrators should verify the actual GitHub ruleset and branch-protection settings.
- Make changes on feature or review branches and open pull requests.
- Do not merge, publish or deploy without explicit project-owner approval.
- Vercel is outside the scope of this repository documentation update.
