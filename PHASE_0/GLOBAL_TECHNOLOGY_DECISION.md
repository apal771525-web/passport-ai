# Global Technology Decision — Passport AI

**Status:** Strong recommendation for founder review; not implemented or approved for coding.
**Scope:** Worldwide product architecture, designed for incremental country/document rollout.
**Research date:** 17 November 2026.

## Executive recommendation

Build Passport AI as a **modular Next.js + TypeScript web application**, with a browser-first image engine, a separately testable route-compliance engine, and a small backend added only where a real product requirement needs it.

Do not build a microservice fleet or a large AI platform for the first release. Start with a modular monolith and clear internal boundaries. This is easier to test, operate, and evolve while the product and market are still being validated.

Worldwide ambition does not mean every country's route can be labelled supported on day one. Launch globally accessible, but mark each document/application route as verified, limited, unavailable, or under review. Add routes only after official-source review and tests.

## 1. Recommended stack

| Area | Recommendation | Reason / boundary |
|---|---|---|
| Application framework | Next.js App Router + React + TypeScript | Structured routing, server/client separation, typed application code and broad deployment options. |
| UI | Accessible component system + Tailwind CSS | Consistent responsive interface; preserve existing product design decisions where possible. |
| Internationalisation | Locale-aware routing and translation dictionaries; evaluate a mature i18n library during implementation | Worldwide language, date, number and accessibility support. Do not hard-code text in screens. |
| Image engine | Browser Canvas APIs, OffscreenCanvas where supported, Web Workers | Keep permitted operations on-device and avoid blocking the UI thread. |
| Visual quality assistance | Pluggable, benchmarked computer-vision model(s) | Use only for permitted framing, face-position, blur, exposure and background checks. No identity recognition or face embeddings. |
| Compliance engine | Pure TypeScript domain module + versioned rules registry | Deterministic, auditable route-specific decisions; independent from the UI and AI model. |
| Backend | Next.js server routes initially, Node runtime for tasks needing Node APIs | Avoid a separate service until load, processing or isolation requirements justify it. |
| Database | Managed PostgreSQL only when accounts, billing or saved rule administration require persistence | Relational integrity and portability; no database needed for a local-only anonymous workflow. |
| Authentication | Select a managed provider only after account requirements and data regions are decided | Do not force account creation for a one-time photo workflow. |
| Object storage | Cloudflare R2 or equivalent only for explicit, consent-based temporary storage | No default image archive; use private objects, short-lived access and lifecycle deletion. |
| Hosting/CDN | Existing Vercel setup is the initial candidate, subject to canonical-project review | Keep current Vercel projects/settings unchanged until separately approved. |
| Testing | Vitest (or equivalent) + Playwright browser E2E | Test rule logic, file handling, mobile journeys and real browser behavior. |
| Observability | Privacy-safe errors, performance and product events | Never log image bytes, raw face data, unnecessary EXIF or access tokens. |

Next.js documents the App Router and the separation of Server and Client Components. It can be deployed to a Node server, Docker, static export (with feature limitations), or compatible platforms. Browser OffscreenCanvas is available in workers in modern browsers and can move canvas work away from the main UI thread. These are good technical foundations, not a guarantee that every low-end device supports every feature.

## 2. Proposed system shape

```text
Browser / Mobile Web
  ├─ Internationalised UI and guided capture
  ├─ Secure file intake and local image engine
  ├─ Visual quality assistance (optional model adapter)
  ├─ Route policy + deterministic compliance checks
  └─ Digital / print export
          |
          | only for features that require server state
          v
Next.js application backend
  ├─ Authentication (optional)
  ├─ Billing (later, after pricing validation)
  ├─ Rule administration / publishing workflow
  ├─ Consent-controlled temporary processing
  └─ Minimal audit and operational events
          |
          +── PostgreSQL (only when persistence is justified)
          +── Private object storage (temporary, consent-based only)
```

The compliance engine must not depend on an AI model's free-form answer. AI may estimate visual attributes; deterministic rules decide whether measurable requirements pass, fail, need review, or cannot be checked.

## 3. Photo processing and AI design

### Default local-first path

1. Read file locally and validate extension, MIME, signature, size, dimensions and decodability.
2. Enforce pixel limits and safe decoding; reject malformed or oversized files.
3. Preserve the original as an immutable source for the current workflow.
4. Resolve the selected jurisdiction + authority + document + application channel + applicant category.
5. Load that route's policy and allowed-operation list.
6. Run permitted local quality checks and deterministic geometry checks.
7. Enable only transformations explicitly allowed by the route.
8. Export and verify actual output bytes, dimensions, format and file size.
9. Clear in-memory data when the workflow ends where feasible; do not upload by default.

### AI boundaries

- No face recognition, identity matching, demographic inference, or face-embedding storage.
- No beautification, face reshaping, age alteration, skin smoothing or expression changes.
- Never let a model override a route's prohibition on image alteration.
- Model output must include confidence and an abstain/needs-review path.
- Benchmark on varied skin tones, lighting, cameras, ages and devices; measure false pass and false fail rates.
- Keep model choice behind an adapter so it can be replaced after licensing, privacy, accuracy and device-performance tests.
- Do not send a face image to a third-party AI API unless the user is clearly informed, the route and feature require it, and valid consent and processor review are complete.

## 4. Worldwide product and compliance architecture

Treat each supported workflow as a route, not just a country preset. Minimum route key:

- Country / jurisdiction and issuing authority
- Document type (passport, visa, residence permit, identity card, other)
- Application channel (online, in-person, renewal, first issue, etc.)
- Applicant class where relevant (adult, child, infant)
- Output type (digital upload, printed photo, print sheet, code/credential)

Every published rule record must carry official source URL/title, source excerpt or structured evidence, effective date when known, last checked date, reviewer, version, test fixtures and review status. Add rule expiry/review reminders and a safe fallback when a source is ambiguous or stale.

Use route statuses such as:
- **Verified:** official source reviewed and all required automated checks tested.
- **Limited:** only a subset of requirements can be checked automatically.
- **Needs review:** ambiguous, conflicting or overdue official guidance.
- **Unavailable:** not yet researched or not supported.

Never use a worldwide count of countries or documents as a marketing claim unless coverage is actually verified and maintained.

## 5. Privacy, security and data minimisation

- Anonymous local processing should be the default.
- Do not retain original photos by default; no hidden photo history.
- If server processing is introduced, obtain clear consent, state purpose and retention, use private storage and short-lived access, and delete promptly.
- Separate account data from image content.
- Use encryption in transit and at rest, least-privilege access, rate limits, file quotas and abuse protection.
- Validate file signatures and decode/re-encode safely; never trust filename or browser MIME alone.
- Strip location metadata from exported files unless a documented route requires otherwise.
- Never log photos, base64 image data, face embeddings, full EXIF, passwords, tokens or payment secrets.
- Complete a privacy impact and legal review for target markets before account-based or server-side image processing launches.

## 6. Scale and performance strategy

Start with a modular monolith and scale only after measuring actual demand:
- CDN-cache public pages, static assets and non-sensitive rule bundles.
- Keep image work in workers and stream/progress UI; cap file size and decoded pixel count.
- Lazy-load visual models and offer a deterministic non-AI fallback.
- Avoid loading a large model on the initial landing page.
- Use database connection pooling and indexed route/version queries if PostgreSQL is introduced.
- Move expensive server processing to a queue/worker service only when measured latency, reliability or platform limits justify it.
- Add regional storage/processing only after legal residency needs and user geography are understood. A provider's location hint is not a residency guarantee.

## 7. Alternatives considered

| Alternative | Decision | Why |
|---|---|---|
| Keep a single large HTML file | Not recommended for long-term product | Harder to isolate domain logic, test route rules, localise and maintain as scope grows. Preserve it as the current baseline/reference during migration planning. |
| Next.js modular monolith | **Recommended** | Good balance of product velocity, typed code, server/client separation and ecosystem. |
| Separate React SPA + independent API immediately | Defer | Adds deployment, authentication, CORS, observability and operational complexity before a demonstrated need. |
| Microservices from day one | Reject for MVP | Too much distributed-system overhead for an unvalidated early product. |
| Cloud-first image processing | Reject as default | Increases sensitive-data exposure, transfer cost and consent burden. Use only when a feature truly requires it. |
| AI-only compliance decision | Reject | Visual models cannot reliably interpret every official rule or replace deterministic checks and human/official authority. |

## 8. Decisions still open

These require evidence or founder approval before implementation:
1. Exact first release routes and languages.
2. Whether accounts are needed at launch.
3. Whether any image ever needs server-side processing or storage.
4. Payment provider, pricing and supported merchant countries.
5. Canonical Vercel project, domains and production deployment controls.
6. Specific visual model, license and benchmark results.
7. Database/auth provider if persistence is approved.
8. Data retention periods and jurisdiction-specific legal obligations.

## 9. Implementation gates

Before coding the migration:
- Capture current prototype behavior and design baseline.
- Create a small architecture spike on an approved feature branch, not main.
- Compare current prototype vs Next.js on mobile load, accessibility, bundle size and maintainability.
- Prototype local image intake, worker processing and deterministic export on low-end Android.
- Build route-rule schema and tests before enabling edit controls.
- Threat-model file uploads and any external model calls.
- Confirm repository CI and preview behavior without changing production settings.
- Obtain explicit founder approval for implementation scope and a separate branch.

## 10. Source notes

- Next.js App Router: https://nextjs.org/docs/app
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js deployment options: https://nextjs.org/docs/app/getting-started/deploying
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- Cloudflare R2 data location: https://developers.cloudflare.com/r2/reference/data-location/

This document is an architecture recommendation, not a claim that any listed service has been configured, purchased, or implemented.
