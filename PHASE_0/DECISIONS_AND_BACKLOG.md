# Decisions and Prioritised Backlog — Phase 0

**Status:** Draft proposals; founder approval required before implementation.  
**Rule:** “Proposed” does not mean selected, purchased, configured, or implemented.

## 1. Decision register

| ID | Topic | Current evidence / constraint | Proposed direction | Status |
|---|---|---|---|---|
| ADR-001 | Product promise | Acceptance is decided by issuing authority; rules vary by route. | Position as transparent photo preparation and checks, not guaranteed acceptance. | Proposed |
| ADR-002 | Route selection | Country-only presets are insufficient. | Select country, authority, document, application channel and relevant applicant category. | Proposed |
| ADR-003 | Original image | Some routes prohibit image alteration. | Keep immutable original; derived copies only; route policy blocks prohibited operations. | Proposed |
| ADR-004 | Processing privacy | Existing prototype does not establish production privacy architecture. | Prefer local processing where feasible; server processing only with disclosed purpose and consent. | Proposed |
| ADR-005 | Frontend architecture | Current app is primarily a single HTML file. | Evaluate modular TypeScript frontend; decide framework after a small migration/complexity assessment. | Open |
| ADR-006 | Image pipeline | Image processing needs file signature validation, safe limits and deterministic export. | Browser Canvas/Web Workers for eligible operations; server-side processing only where justified. | Proposed |
| ADR-007 | Compliance data | Requirements change and are route-specific. | Versioned rule registry with official sources, last-checked date, review status and change history. | Proposed |
| ADR-008 | Backend | Production auth, storage, payments and provider configuration are not established. | Defer backend until MVP needs accounts, server processing or paid services. | Open |
| ADR-009 | Hosting | Two Vercel projects are connected to the repository; ownership/canonical project unresolved. | Keep current projects/settings unchanged until domain and deployment review is approved. | Hold |
| ADR-010 | Monitoring | Image data is sensitive. | Privacy-safe event logging; never log image bytes, face embeddings or unnecessary EXIF. | Proposed |
| ADR-011 | Monetisation | Willingness to pay and price sensitivity are unvalidated. | Test one-time pricing against free basic workflow before committing to subscriptions. | Open |
| ADR-012 | Human review | Competitors use expert review, but operating cost and staffing are unknown. | Do not advertise human review until staffing, SLA, quality process and privacy controls exist. | Hold |

## 2. Proposed technology evaluation

This is an evaluation shortlist, not a final stack decision.

| Layer | Candidate | Why evaluate it | Must validate |
|---|---|---|---|
| Frontend | TypeScript with a modular component framework | Better structure, testability and maintainability than a growing monolithic page. | Migration cost, mobile performance, accessibility, compatibility with current prototype. |
| Styling | Existing styles first; utility CSS only if useful | Avoid unnecessary redesign or churn. | Design consistency and bundle size. |
| Image operations | Browser Canvas plus Web Workers | Local processing can reduce image uploads and improve privacy. | Browser support, memory limits, output accuracy, performance on low-end Android. |
| Visual assistance | Optional on-device model evaluation | Could provide framing/lighting guidance. | Accuracy, model licensing, device performance, bias, and no identity recognition. |
| API/backend | Defer until required | Avoid premature server and data complexity. | Clear use case, abuse controls, cost, data retention and security. |
| Database | Defer until accounts/history are approved | No need to store personal data for a simple local workflow. | Data minimisation and deletion design. |
| File storage | Avoid by default; evaluate only if user needs cloud history | Reduces sensitive image retention. | Encryption, access control, lifecycle deletion and processor terms. |
| Hosting | Existing Vercel projects pending decision | Current repo is already linked to Vercel. | Canonical project, domains, build settings, protection and deployment flow. |

## 3. Prioritised implementation backlog

### P0 — Before any feature implementation

- [ ] Confirm initial launch routes and their official sources.
- [ ] Resolve existing documentation integrity issues through a separately reviewed change.
- [ ] Inspect current app and tests; document baseline behaviour with screenshots and test output.
- [ ] Define a route-rule schema and review/expiry process.
- [ ] Define original-file immutability and prohibited-operation enforcement.
- [ ] Map current network requests, third-party scripts, image transfer and storage.
- [ ] Define privacy notice, retention, deletion and consent behaviour based on actual architecture.
- [ ] Decide canonical Vercel project and deployment approval process separately; do not alter settings before approval.

### P1 — Trustworthy core workflow

- [ ] Country/authority/document/application-channel selector.
- [ ] Route summary before photo selection.
- [ ] Secure image intake: file signature, MIME mismatch, dimensions, size and corruption checks.
- [ ] Preserve original file and track derived output separately.
- [ ] Route policy engine: allowed/prohibited image operations.
- [ ] Technical validation engine with deterministic test fixtures.
- [ ] Clear pass/review/fail/not-checked result model.
- [ ] Mobile-first camera and file upload journey.
- [ ] Accessible labels, keyboard flow, contrast and screen-reader support.

### P2 — Editing and export, only for routes that permit it

- [ ] Crop/resize with route-specific constraints.
- [ ] Background handling only for verified routes that permit it.
- [ ] Export digital file with verified dimensions, format and size.
- [ ] Print-ready layout where official route requires or permits it.
- [ ] Export integrity and regression tests.
- [ ] Retake, undo and restore-original flows.

### P3 — Reliability and launch readiness

- [ ] Unit tests for rule engine and file validation.
- [ ] Browser end-to-end tests on desktop and Android-sized viewports.
- [ ] Cross-browser testing and low-memory device testing.
- [ ] Security review: upload abuse, file parsing, XSS, dependency and API exposure.
- [ ] Accessibility review.
- [ ] Performance budget and failure monitoring.
- [ ] User support and incident response process.
- [ ] Legal/privacy review for target markets.

### P4 — Commercial features (separate approval)

- [ ] Pricing and willingness-to-pay experiments.
- [ ] Checkout and payment provider selection.
- [ ] Optional accounts and history.
- [ ] Data export and deletion controls.
- [ ] Expert review operations, if staffed.
- [ ] Partner/API offering only after core compliance and reliability are proven.

## 4. Dependencies and sequencing

- Route registry must precede route-specific UI and edit controls.
- Privacy/data-flow review must precede any server upload or retention.
- Original preservation and policy enforcement must precede editing tools.
- Export requirements must precede print/digital deliverable implementation.
- Payment decisions must follow pricing validation and refund/support policy.
- Production deployment decisions must follow the separate Vercel project review and founder approval.

## 5. Definition of done for a route

A route is “ready for controlled release” only when:
- official requirements and source metadata are reviewed;
- allowed/prohibited operations are encoded and tested;
- exact file constraints have automated fixtures;
- original-file preservation is verified;
- user-facing checks explain limitations;
- privacy and security review passes;
- mobile and accessibility tests pass;
- support and rollback plans exist.

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Rule changes or ambiguous official guidance | Incorrect advice or rejected photo | Source registry, review dates, expiry status, safe fallback |
| Accidental prohibited editing | User submits altered image | Enforce route policy in UI and processing layer; preserve original |
| False visual pass | User trusts inaccurate automated result | Confidence thresholds, “review” state, clear limitation |
| Sensitive image exposure | Privacy harm and legal exposure | Local-first, minimal retention, explicit consent, no sensitive logs |
| Mobile device memory/performance | Workflow crashes or fails | File limits, workers, device testing, graceful fallback |
| Misleading acceptance claims | Trust, legal and reputational risk | Carefully reviewed language; no blanket guarantee |
| Premature backend/payment scope | Cost and delivery delay | Defer until validated need and founder decision |

## 7. Founder decisions required before Phase 1 implementation

1. Select first three to five exact launch routes.
2. Approve MVP feature boundary: capture, checks, permitted edits, exports.
3. Decide account requirement and retention model.
4. Decide monetisation experiment and whether expert review is excluded.
5. Approve frontend architecture after comparison with current prototype.
6. Approve a separate implementation branch and explicit coding scope.
7. Separately review canonical Vercel project and deployment permissions.
