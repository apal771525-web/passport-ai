# Known Limitations

This repository is a prototype and is not ready for public production use.

## Product and frontend

- The primary UI is a large, monolithic `index.html`.
- Standalone validation and document-rule modules are not integrated across all UI workflows.
- Real Android Chrome, desktop browser, accessibility and printer testing have not been evidenced.
- Optional MediaPipe scripts/models load from external hosts; network and privacy behavior needs explicit review.
- Image quality estimates are advisory, not official compliance checks.

## Country rules

- The registry covers only a small initial set of routes.
- Exact official requirements may change and have not been independently revalidated for launch.
- Fuzzy route matching can select an unintended rule; stable exact route IDs are required.
- No guarantee of government acceptance is possible.

## Backend and business

- No production backend, authentication, database, durable storage or account system.
- No live rate limiting or production authorization.
- No approved external image-processing provider.
- No payment, subscription, refund or admin workflows.

## Release

Do not treat the application as production-ready until automated tests pass on the target commit and browser/device, privacy, security, accessibility and official-source verification gates are completed.
