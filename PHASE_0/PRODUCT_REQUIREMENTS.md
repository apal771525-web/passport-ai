# Passport AI — Product Requirements (Draft)

## 1. Product vision

Build a trustworthy global document-photo preparation platform that helps people capture, prepare, inspect, and export photographs for supported passport, visa, and identity-document application routes.

The product must explain limitations clearly. It must not imply that an automated check guarantees acceptance by a government authority.

## 2. Target users

- Individuals preparing a passport, visa, or identity-document photo.
- Parents or guardians preparing eligible child-photo workflows, with additional safeguards.
- Photo studios and print providers that may need repeatable preparation tools.
- Business partners that may later integrate a documented API.

These are proposed segments; demand and willingness to pay require validation.

## 3. Core user journey

1. Select country, document type, application route, and digital or printed output.
2. Read route-specific capture and editing instructions before uploading.
3. Capture or select a photo.
4. Run local technical checks where supported: file readability, dimensions, framing, lighting, blur, and background.
5. Show actionable results with explanations and uncertainty—not a misleading universal pass/fail.
6. Apply only transformations permitted for that route.
7. Preview and export the correct file or print layout.
8. Explain that final acceptance remains with the issuing authority.

## 4. Proposed feature groups

### MVP foundation
- Responsive, accessible, mobile-first interface.
- Guided photo capture and file selection.
- Safe image decoding and validation.
- Crop, rotate, resize, and format conversion for permitted routes.
- Preview and downloadable output.
- Clear error states and privacy notices.

### Photo quality assistance
- Face-position and head-size guidance where technically appropriate.
- Blur, exposure, lighting, and background checks.
- Background segmentation only for routes where alteration is permitted.
- Explain each warning and provide recapture guidance.

### Compliance intelligence
- Route-specific requirements registry.
- Official-source link, jurisdiction, route, effective/review date, and rule version.
- Separate digital and printed requirements.
- Explicit unsupported-route handling.
- Tests for every published rule set.

### Print and professional workflows
- Print-sheet layout with physical dimensions and documented DPI assumptions.
- Studio workflow and batch handling only after privacy/security review.
- Optional expert review only if a real, staffed service and service-level policy are established.

### Future platform capabilities
- Accounts and history, if user value justifies retaining data.
- Payments/subscriptions after pricing validation.
- Studio dashboard and partner API after MVP reliability is demonstrated.
- Localization and broader country coverage after official-source verification.

## 5. Non-goals and prohibited claims

- No guarantee that a photo will be accepted.
- No face recognition, identity matching, or biometric identification in the initial product scope.
- No AI beautification, face reshaping, age alteration, or deceptive identity changes.
- No automatic background replacement or other alteration on routes requiring an unaltered original.
- No claim that a generic image score is an official government validation.
- No storage of uploaded photos by default.

## 6. Product success measures

Measure only after analytics are designed to avoid collecting sensitive image content:
- Successful export completion rate.
- Photo recapture rate and reasons.
- Time from route selection to valid export.
- Error rate by device/browser.
- Support contacts and refund/complaint rate, if paid services launch.
- Accessibility and performance metrics.

Do not use face images, face embeddings, or raw photo content as analytics events.

## 7. Decisions required from founder

- Initial launch countries and exact application routes.
- Whether the first release is entirely free, freemium, or paid.
- Whether accounts are needed at launch.
- Whether any server-side processing is genuinely required.
- Whether print delivery or expert review is in scope.
- Brand positioning and supported languages.
