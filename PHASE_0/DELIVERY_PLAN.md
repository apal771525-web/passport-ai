# Passport AI — Delivery Plan and Acceptance Gates

## Phase 0 — Discovery and specification

**Goal:** Agree on what to build and how to build it safely.

Deliverables:
- Verified current-state inventory.
- Competitor and pricing comparison with dated sources.
- Product requirements and user journeys.
- Country/document route shortlist with official sources.
- Architecture decision record.
- Privacy/security requirements and data-flow map.
- Repository and Vercel consolidation proposal.
- Prioritized implementation backlog with acceptance criteria.

Exit criteria:
- Founder approves initial markets and route scope.
- Every initial route has an official source and reviewed rule record.
- Architecture and privacy decisions are documented.
- Canonical Vercel project decision is supported by domain and deployment evidence.
- No unresolved critical security blocker is hidden or waived without explicit decision.

## Phase 1 — Stable photo-preparation MVP

Scope:
- Guided route selection.
- Safe file validation and image decoding.
- Crop/rotate/resize and allowed export.
- Responsive accessible UI.
- Local processing by default.
- Clear unsupported-route and alteration warnings.

Exit criteria:
- Unit and integration tests pass.
- Browser E2E flows pass on supported mobile and desktop browsers.
- Export dimensions, formats, file size, and metadata behaviour are verified.
- No known critical/high security issue remains open.

## Phase 2 — Photo quality assistance

Scope:
- Framing and head-position assistance.
- Blur, lighting, and background checks.
- Optional segmentation only for eligible routes.

Exit criteria:
- Accuracy and failure modes are measured on a diverse, consented test set.
- False confidence is minimized; uncertainty is communicated.
- Device performance and accessibility are tested.

## Phase 3 — Compliance intelligence

Scope:
- Versioned country/document/application route registry.
- Official source links and verification dates.
- Route-specific transformation policy.
- Regression tests and review workflow.

Exit criteria:
- Every launched route has official-source review and test coverage.
- Unsupported and changed requirements are handled safely.
- Product language avoids acceptance guarantees.

## Phase 4 — Accounts and commercial infrastructure

Scope only after validation:
- Authentication and user settings.
- Payments/subscriptions.
- Minimal database and optional storage.
- Customer support and refund workflows.

Exit criteria:
- Data retention and deletion are implemented and tested.
- Billing, access control, webhook verification, and abuse prevention are tested.
- Legal/privacy review is complete for target markets.

## Phase 5 — Global launch readiness

- Localization and accessibility.
- Performance and reliability.
- Operational monitoring and incident response.
- Customer support documentation.
- Market-specific legal review.
- Controlled release and rollback plan.

## Change-control rules

- Work on separate branches.
- Require review and tests before merging.
- Keep `main` stable.
- Do not merge PRs, alter Vercel settings, delete projects/domains, or deploy production without explicit founder approval.
- Record decisions and rejected alternatives in an architecture decision log.
