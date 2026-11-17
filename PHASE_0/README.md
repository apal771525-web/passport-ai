# Passport AI — Phase 0 Planning

**Status:** Draft for founder review  
**Branch:** `phase-0-planning`  
**Base:** `main` at `3741e000cca83a882a1978e0426a7972e04b5ead`

## Purpose

Phase 0 establishes a verified product, engineering, privacy, compliance, and delivery baseline before substantial implementation. These documents are planning artifacts, not evidence that proposed features exist or are production-ready.

## Current verified baseline

- The repository default branch is `main`; the project currently identifies itself as a global AI passport and visa photo platform.
- The current main application is primarily a single `index.html` entry point. The repository language is reported as HTML.
- The existing project is a prototype. Production backend, authentication, durable storage, payments, and a configured production image-processing provider are not established by the inspected main-branch materials.
- Existing tests are limited in scope; they do not establish full browser, device, accessibility, security, or government acceptance.
- Main-branch documentation has content mismatches that need review. PR #8 proposes documentation repairs on a separate branch.
- Two Vercel projects were found connected to the same GitHub repository. Neither should be deleted or changed until domain, deployment, and ownership decisions are reviewed.

## Documents

1. [Product requirements](PRODUCT_REQUIREMENTS.md)
2. [Technical architecture proposal](TECHNICAL_ARCHITECTURE.md)
3. [Security and privacy requirements](SECURITY_PRIVACY.md)
4. [Delivery plan and acceptance gates](DELIVERY_PLAN.md)
5. [Competitor research](COMPETITOR_RESEARCH.md)
6. [Country and document route research](COUNTRY_ROUTE_RESEARCH.md)
7. [User journeys and screen specification](USER_JOURNEYS.md)
8. [Decisions and prioritised backlog](DECISIONS_AND_BACKLOG.md)
9. [Global technology decision](GLOBAL_TECHNOLOGY_DECISION.md)


## Decision rules

- No claim of government approval, guaranteed acceptance, or certified compliance without evidence from the relevant authority.
- Country rules must be tied to an official source, a specific document/application route, and a review date.
- Photo alteration must be prohibited or restricted wherever the applicable official route requires an unaltered original.
- Prefer local/browser processing where practical; do not upload or retain sensitive images without a clearly disclosed need and user consent.
- Keep changes on review branches until explicitly approved.
- Do not merge pull requests, alter Vercel settings, delete projects/domains, or deploy production without explicit founder approval.

## Open questions

Product scope, launch countries, exact document routes, pricing, retention defaults, account requirements, and the final hosting/backend choices remain decisions for founder review. See the linked documents.
