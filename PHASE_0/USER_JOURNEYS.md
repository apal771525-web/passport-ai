# Passport AI — User Journeys and Screen Specification

**Status:** Phase 0 draft for founder review  
**Scope:** Product behaviour and acceptance criteria only. This document does not claim that these screens or features are implemented.

## 1. Core journey principles

- Ask only for information needed to identify the exact document route.
- Tell users what will happen to their image before they select or upload it.
- Preserve the original file. Never silently overwrite it.
- Apply route-specific restrictions before enabling image operations.
- Distinguish technical validation from visual estimates and government decisions.
- Explain errors in plain language and offer a safe next step.
- Never claim guaranteed government acceptance.

## 2. Primary journey map

1. Landing page
2. Select country and issuing authority
3. Select document and application method
4. Confirm applicant category and route
5. Read route summary and privacy notice
6. Capture or select photo
7. Guided capture / image intake
8. Automated technical and visual checks
9. Route-permitted correction studio (or no-edit review)
10. Preview and export selection
11. Download / print instructions
12. Optional account, payment, or expert-review flow (only if approved as an MVP feature)

## 3. Screen specifications

### Screen 1 — Landing page

**Goal:** Explain the service and start a route-specific workflow.

**Content:**
- Clear product promise: prepare and check a photo for a selected document route.
- Primary CTA: “Start my photo”.
- Brief privacy statement that accurately reflects the actual processing architecture.
- Short explanation: checks are guidance; final acceptance belongs to the issuing authority.
- Links to supported countries, help, privacy, terms, and contact.

**Acceptance criteria:**
- CTA starts the route selector.
- No unsupported “government approved” or universal acceptance claim.
- Privacy wording matches actual implementation, not a future aspiration.
- Supported-route list is maintained from the verified rule registry.

### Screen 2 — Country and issuing authority

**Goal:** Establish who sets the photo rules.

**Inputs:** Country; issuing authority/mission where the route requires it.

**Behaviour:**
- Searchable country list.
- Explain when country is not enough and an issuing authority must be selected.
- Do not default to a country based only on IP or browser locale.
- “Not listed” path must not apply a guessed preset.

**Acceptance criteria:**
- User can go back and change the country.
- Unknown route is explicitly labelled unsupported/unverified.
- No route rules are applied until required selections are complete.

### Screen 3 — Document and application channel

**Goal:** Distinguish different rules within the same country.

**Inputs:** Document type (passport, visa, identity document, etc.); application channel (online upload, paper, renewal, consular/mission submission).

**Behaviour:**
- Show only routes with a maintained source record.
- Where a route has multiple variants, explain the distinction in everyday language.
- Do not treat “passport” as one universal preset.

**Acceptance criteria:**
- Every selectable route maps to a unique rule record/version.
- A missing route does not silently fall back to a similar route.

### Screen 4 — Applicant category

**Goal:** Apply child/adult/infant differences only when official guidance requires them.

**Inputs:** Applicant category or age band, only where required by the selected route.

**Behaviour:**
- Ask the minimum necessary question.
- Avoid collecting full date of birth unless required.
- Provide accessibility or exception guidance where official sources support it.

**Acceptance criteria:**
- Category selection changes the rules only when a verified rule variant exists.
- Unverified exceptions are clearly referred to the issuing authority.

### Screen 5 — Route summary and privacy

**Goal:** Let the user understand the rules before photo handling begins.

**Show:**
- Country, authority, document, channel and applicant category.
- Key technical requirements and prohibited edits.
- Whether the route permits any image processing.
- Whether image processing is local or server-side in the current build.
- Retention/deletion details and any third-party processor disclosure.

**Acceptance criteria:**
- User must affirmatively continue.
- No claim of local-only processing unless network behaviour has been tested and confirmed.
- If route requires an unaltered original, say so before photo selection.

### Screen 6 — Capture or choose photo

**Goal:** Provide a safe intake path.

**Options:** Use camera; choose existing image.

**Behaviour:**
- Explain supported file types and limits before selection.
- Preserve the original bytes where feasible.
- Validate file signature, not only browser-provided MIME type.
- Reject corrupt, unsupported, or oversized files with a useful explanation.
- Do not upload by default unless the selected feature requires it and the user has consented.

**Acceptance criteria:**
- Original file is never silently replaced.
- File validation runs before processing.
- Errors do not expose stack traces or internal service details.

### Screen 7 — Guided capture

**Goal:** Help the user take a better photo before capture.

**Guidance:** Camera distance, head position, lighting, plain background, no other people/objects, neutral expression where required.

**Behaviour:**
- Display route-specific guidance only when sourced.
- Treat face-position overlays as guidance, not official measurement.
- Do not reshape facial features or beautify.
- Allow camera permission denial and fallback to file selection.

**Acceptance criteria:**
- Camera access is requested only after user action.
- Denial does not block the rest of the workflow.
- Guidance does not claim to identify or verify a person's identity.

### Screen 8 — Checks and results

**Goal:** Report objective technical checks separately from visual estimates.

**Result groups:**
- File checks: type, dimensions, file size, aspect ratio.
- Visual guidance: face position, background uniformity, shadows, lighting, pose.
- Route restrictions: edits allowed/prohibited and whether the original must be preserved.

**Status vocabulary:**
- Pass: measurable check meets the stored rule.
- Review: visual estimate or ambiguous requirement needs human/user attention.
- Fail: measurable hard constraint is not met.
- Not checked: feature unavailable or not reliable.

**Acceptance criteria:**
- Each result explains why it was shown and which rule/source version it used.
- A visual model cannot mark a subjective check as an official pass.
- “All checks passed” is accompanied by a clear non-acceptance disclaimer.

### Screen 9 — Correction studio or no-edit mode

**Goal:** Offer only operations permitted by the selected route.

**If edits are permitted:** expose only allowed crop, resize, background, or export operations supported by the verified route.

**If edits are prohibited:** disable editing controls, preserve the original, and offer capture guidance or a retake instead.

**Acceptance criteria:**
- Route policy is enforced in both UI and processing layer.
- No prohibited tool is reachable through a hidden UI path or direct API call.
- Every derived image is separate from the original and clearly labelled.

### Screen 10 — Preview and export

**Goal:** Let the user inspect the output and choose the correct deliverable.

**Potential outputs:** Digital file; print-ready single photo; print sheet; route-specific dimensions and file format.

**Behaviour:**
- Show exact dimensions, file type, file size and output quality.
- Warn when a print sheet is not an accepted digital upload.
- Provide a way to return to the original or retake.
- Do not add watermarks unless the user is explicitly shown this before purchase/export.

**Acceptance criteria:**
- Export settings come from the selected route record.
- Export is tested for actual pixel dimensions and file size.
- The downloaded file opens correctly on supported devices.

### Screen 11 — Download and completion

**Goal:** Deliver the file and next-step instructions.

**Content:**
- Download action and file details.
- Route reminder and source last-checked date.
- Clear statement that the authority makes the final decision.
- Support link and privacy/deletion controls.

**Acceptance criteria:**
- Download failure can be retried.
- No photo is retained longer than the disclosed policy.
- The user can understand which file to use for which application channel.

### Screen 12 — Optional account, checkout, expert review

**Status:** Not committed to MVP. Requires separate product, legal, support and payment decisions.

**If approved later:**
- Explain what is paid and what is free before checkout.
- Show total price, currency, taxes, recurring status and refund terms.
- Do not gate a required legal disclaimer behind payment.
- Expert review must be genuinely staffed and have a documented scope and response time.
- Accounts must not be mandatory if a one-time local workflow can satisfy the use case.

## 4. Cross-cutting states

Every screen must consider:
- loading and slow network;
- offline or interrupted connection;
- permission denied;
- unsupported country/route;
- stale or withdrawn rule;
- invalid/corrupt file;
- image too large or too small;
- processing failure;
- export failure;
- user cancellation and back navigation;
- keyboard/screen-reader and mobile viewport support.

## 5. MVP acceptance gates

A route cannot launch until:
1. Its official source has been reviewed and recorded.
2. Route-specific allowed/prohibited operations are approved.
3. Technical requirements have automated tests.
4. Original-image preservation and no-edit rules are tested.
5. User-facing wording is reviewed for clarity and non-guarantee language.
6. Privacy/data flows are verified against the actual deployed implementation.
7. Mobile browser, accessibility, security and export tests pass.

## 6. Open founder decisions

- Which first three to five exact routes should launch?
- Is account creation required, optional, or deferred?
- Is MVP free, paid per export, subscription, or mixed?
- Is human review in scope, and who will staff it?
- Which outputs are essential for first release?
- Which languages are required at launch?
