# PassportAI — Route Policy Engine Specification (P1-A)

**Status:** Detailed engineering specification; planning only  
**Branch:** `phase-1-core-photo-engine`  
**Base:** `main`  
**Version:** 1.0.0-draft  
**Decision:** No application code, official route rules, or external processing is enabled by this document.

## 1. Purpose and safety boundary

The route-policy engine is the single authorization point between a selected document workflow and any image transformation or export. It answers only:

1. Has the user selected one unambiguous route?
2. Is that route backed by current, reviewed official-source evidence?
3. Is the requested operation explicitly permitted for that route and output channel?
4. Are all required constraints available and valid?
5. Can the requested export proceed without contradicting any higher-priority prohibition?

It does **not** decide whether a government will accept a photograph, identify a person, or certify identity. UI labels must say “technical checks passed” rather than “government approved” or “guaranteed compliant”.

## 2. Route identity — no ambiguous defaults

A route key is a tuple, not a country-only dropdown value:

- jurisdiction code (ISO 3166-1 alpha-2 where applicable);
- issuing authority / mission identifier;
- document type;
- application channel (web portal, in-person, mail, visa application centre, etc.);
- applicant category where official instructions distinguish it;
- output channel (digital upload or physical print);
- workflow/version identifier where the authority distinguishes renewal, first application, emergency, child, or other flows.

A missing dimension that can change requirements makes the route ambiguous. Do not silently select a generic “passport” or “Schengen” preset. If an authority has not been independently verified for the exact tuple, return a review-required result.

## 3. Draft TypeScript contract

The following is a proposed language-neutral contract to implement after approval. It is not an existing production API.

```ts
type RouteStatus =
  | "verified"
  | "needs_review"
  | "unsupported"
  | "expired"
  | "retired";

type Operation =
  | "crop"
  | "rotate"
  | "resize"
  | "background_replace"
  | "colour_adjust"
  | "exposure_adjust"
  | "retouch"
  | "face_geometry_change"
  | "synthetic_face_generation"
  | "compression"
  | "metadata_strip"
  | "print_layout";

type OutputChannel = "digital" | "printed";

interface RouteKey {
  jurisdiction: string;
  authorityId: string;
  documentType: string;
  applicationChannel: string;
  applicantCategory: string | null;
  outputChannel: OutputChannel;
  workflowId: string | null;
}

interface OfficialSource {
  url: string;
  title: string;
  publisher: string;
  accessedAt: string;       // ISO-8601 UTC
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  contentFingerprint: string;
}

interface ReviewRecord {
  reviewerId: string;
  reviewedAt: string;       // ISO-8601 UTC
  nextReviewAt: string;     // ISO-8601 UTC
  reviewNotes: string;
}

interface OutputConstraints {
  widthPx: number | null;
  heightPx: number | null;
  minWidthPx: number | null;
  maxWidthPx: number | null;
  minHeightPx: number | null;
  maxHeightPx: number | null;
  aspectRatio: number | null;
  allowedFormats: string[];
  maxBytes: number | null;
  minBytes: number | null;
  printWidthMm: number | null;
  printHeightMm: number | null;
  dpi: number | null;
}

interface RoutePolicy {
  schemaVersion: "1.0";
  policyId: string;
  policyVersion: number;
  route: RouteKey;
  status: RouteStatus;
  sources: OfficialSource[];
  review: ReviewRecord | null;
  allowedOperations: Operation[];
  deniedOperations: Operation[];
  constraints: OutputConstraints | null;
  userNotice: string;
  rationale: string;
}
```

### Contract invariants

- `face_geometry_change` and `synthetic_face_generation` are always denied for official identity-photo workflows.
- A denied operation always overrides an allow entry. Conflicting lists invalidate the policy and fail closed.
- `verified` requires at least one official primary source, a reviewer, review timestamp, next-review timestamp, and route-specific operation decisions.
- `needs_review`, `unsupported`, `expired`, and `retired` authorize no edited official export.
- Missing constraints are unknown, not zero, unlimited, or inherited from another route.
- A source URL alone is not verification. The reviewed page must support the exact route and each claimed constraint.
- A content fingerprint is for change detection, not proof of source authenticity.

## 4. Policy evaluation result

Every decision must return a typed result with a stable reason code. Never return a bare boolean.

```ts
type DecisionCode =
  | "ALLOW"
  | "ROUTE_NOT_FOUND"
  | "ROUTE_AMBIGUOUS"
  | "ROUTE_NOT_VERIFIED"
  | "POLICY_EXPIRED"
  | "POLICY_SOURCE_MISSING"
  | "POLICY_CONFLICT"
  | "OPERATION_NOT_ALLOWED"
  | "OUTPUT_CONSTRAINTS_INCOMPLETE"
  | "POLICY_VERSION_STALE"
  | "INVALID_OPERATION_PLAN";

interface PolicyDecision {
  allowed: boolean;
  code: DecisionCode;
  routeId: string | null;
  policyVersion: number | null;
  allowedOperations: Operation[];
  deniedOperations: Operation[];
  missingFields: string[];
  userMessage: string;
}
```

No raw photo data, EXIF values, face landmarks, embeddings, or filenames should be embedded in this decision object or its logs.

## 5. Deterministic evaluation algorithm

Evaluate in this order; stop at the first blocking condition:

1. Validate the route key shape and normalize only defined identifiers. Do not fuzzy-match authority or document names.
2. Resolve exactly one policy. Zero matches = `ROUTE_NOT_FOUND`; multiple matches = `ROUTE_AMBIGUOUS`.
3. Require status `verified`. Otherwise return `ROUTE_NOT_VERIFIED` or `POLICY_EXPIRED`.
4. Validate source and review metadata. Missing official primary evidence = `POLICY_SOURCE_MISSING`.
5. Compare current UTC time with `nextReviewAt` and source effective dates. If review is overdue or source has expired, fail closed.
6. Validate policy invariants. Any operation overlap, invalid constraints, unsupported enum, or contradictory rule = `POLICY_CONFLICT`.
7. Validate that every requested operation is in `allowedOperations` and absent from `deniedOperations`. Otherwise return `OPERATION_NOT_ALLOWED`.
8. Validate that required output constraints for the requested output channel are complete and internally consistent.
9. Bind the decision to `policyId + policyVersion + contentFingerprint`.
10. Immediately before export, re-resolve the policy and repeat the checks. A version/fingerprint change invalidates the edit plan.

A route can permit capture guidance while denying image editing and official export. The UI should keep these separate capabilities distinct.

## 6. Operation semantics

Operations must be explicit and independently authorized:

- **crop:** any change to framing or pixels, including automatic face-centering.
- **rotate:** pixel rotation or orientation correction. Distinguish display-only EXIF orientation from rewriting pixel data.
- **resize:** resampling to new pixel dimensions.
- **background_replace:** segmentation, masking, fill, compositing, or replacement.
- **colour_adjust / exposure_adjust:** any pixel-level tonal or colour transformation.
- **retouch:** removal or modification of blemishes, marks, shadows, wrinkles, or other appearance details.
- **face_geometry_change:** face shape, feature position, proportions, or expression modification.
- **synthetic_face_generation:** generation, reconstruction, or replacement of facial pixels.
- **compression:** lossy or lossless re-encoding that changes file bytes; separately distinguish container-only metadata changes.
- **metadata_strip:** removing metadata from an exported derivative.
- **print_layout:** placing one or more copies on a print sheet; it must not silently crop or resample the source.

No operation should be treated as “just formatting” without explicit policy treatment. The original upload remains byte-for-byte unchanged regardless of derivative processing.

## 7. Route decision table — initial safe state

This table is a release gate, not a claim about current government rules. No route is pre-approved by this specification.

| Route family | Initial status | Editing/export behaviour |
|---|---|---|
| Unknown country or authority | unsupported | No edited official export |
| Generic Schengen | needs_review | No generic preset; require issuing country/authority and channel |
| US passport | needs_review | Preserve original; block edited official export until current route instructions and permitted operations are reviewed |
| US visa | needs_review | Separate visa category and application channel; block edited export until reconciled |
| UK visa | needs_review | No edited official export until exact route policy is verified |
| Canada passport | needs_review | Distinguish paper/digital and application path; no inferred permissions |
| Australia passport | needs_review | No edited official export until qualified review resolves online-service and retouching cautions |
| Any verified route | verified only after review | Only explicitly allowed operations and exact verified constraints |

A route may move to `verified` only through a documented source-review process. A code change or passing unit test cannot promote a route to verified.

## 8. Test catalogue and acceptance criteria

Implement table-driven unit tests using synthetic policy fixtures. Never use real people's passport photos in CI.

### Resolution and status
- RP-001: exact route tuple resolves to one policy.
- RP-002: no matching route returns `ROUTE_NOT_FOUND`.
- RP-003: two matching routes return `ROUTE_AMBIGUOUS`.
- RP-004: missing authority or application channel cannot fall back to a generic preset.
- RP-005: each non-verified status blocks edited official export.
- RP-006: expired `nextReviewAt` blocks export.
- RP-007: future effective date blocks use before it takes effect.

### Operation authorization
- RP-010: each explicitly allowed operation is accepted for a verified fixture.
- RP-011: each denied operation is rejected.
- RP-012: an operation absent from both lists is rejected.
- RP-013: denied entry wins over conflicting allow entry and invalidates the policy.
- RP-014: face geometry and synthetic face operations are always rejected.
- RP-015: UI visibility does not change engine authorization.
- RP-016: multi-operation plans are rejected if any one operation is denied.

### Constraints and versioning
- RP-020: missing output constraints reject official export.
- RP-021: contradictory min/max dimensions reject policy.
- RP-022: no dimensions or limits are inherited from another route.
- RP-023: changed policy version invalidates an existing edit plan.
- RP-024: changed source fingerprint requires review before policy reuse.
- RP-025: export re-evaluates policy rather than trusting a cached UI decision.

### Privacy and integrity
- RP-030: policy decisions contain no image bytes or base64.
- RP-031: logs contain no file name, EXIF/GPS, face landmarks, or embedding.
- RP-032: original input bytes are unchanged after success, rejection, and thrown errors.
- RP-033: derived output records operation IDs and policy version but no biometric data.
- RP-034: offline policy lookup does not silently use a stale verified record past review expiry.

### UI and user communication
- RP-040: capture guidance can be shown while editing is denied.
- RP-041: “technical checks passed” never becomes “government approved”.
- RP-042: blocked export explains the reason and offers original-file download.
- RP-043: route ambiguity prompts for the missing route dimension rather than guessing.

**P1-A acceptance:** all contract invariants are documented; the decision algorithm is deterministic; every reason code has at least one test; fail-closed cases have negative tests; and product language distinguishes technical validation from official acceptance.

## 9. Integration contract

- UI obtains a `PolicyDecision` from the same engine used by the transform runner and export gate.
- The transform runner accepts a validated operation plan, not arbitrary UI state.
- The export gate re-evaluates route key, policy version, source fingerprint and operation list.
- Backend endpoints, if ever separately approved, must use the same policy contract. The current backend remains disabled.
- Policy data is versioned and reviewed independently from code releases.
- Do not copy route-specific rules into UI conditionals or provider presets.

## 10. Operational governance

Every route-policy change must include: source URL, source title, exact route tuple, reviewer, review date, next review date, policy version, changed operations/constraints, rationale, and tests. A source change or overdue review moves the route out of verified status until re-reviewed.

Review cadence should be defined by product compliance owners. Until a cadence and ownership model exist, do not automatically claim that a route remains current indefinitely. A scheduled reminder is not a substitute for source verification.

## 11. Rollout sequence from zero to advanced

- **P1-A1:** approve this contract and terminology.
- **P1-A2:** implement schema validation and policy fixture loader.
- **P1-A3:** implement exact route resolver and deterministic decision function.
- **P1-A4:** implement policy version/fingerprint invalidation.
- **P1-A5:** implement table-driven unit tests and coverage thresholds.
- **P1-A6:** add UI adapter and export-gate integration tests.
- **P1-A7:** conduct independent privacy/compliance review.
- **P1-B:** only then proceed to safe image intake and decoding.

## 12. Explicit non-actions

This document does not implement the engine, add country rules, change `index.html`, enable background removal, call external AI services, upload photos, change PRs, merge, configure GitHub/Vercel, or deploy. These require separate explicit approval.
