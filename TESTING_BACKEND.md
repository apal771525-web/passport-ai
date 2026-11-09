# PassportAI backend scaffold tests and security notes

These tests use Node.js built-in `node:test` and require no third-party packages.

Run from the repository root:

```sh
node --test
```

The suite covers method and content-type rejection, same-origin checks, malformed input, base64 validation, MIME/signature mismatch, HTTP and image size limits, privacy/security headers, the expected disabled-provider response, the rate-limiter adapter's fail-closed behavior, authentication-guard claim checks, one-time private-upload authorization policy checks, byte-level image header/dimension validation, and advisory face/photo-quality policy behavior.

## Security boundary

- The endpoint is intentionally disabled and does not call Photoroom, BRIA, or any other provider.
- The small PNG fixture checks only the file-signature gate; it is not a complete decodable image and does not test image quality.
- Same-origin validation is a browser-request guard, not user authentication. Requests without an Origin header are allowed for server-to-server clients.
- Request body parsing is limited by the Vercel function configuration; the handler also rejects a declared Content-Length above 4 MiB.
- The image payload is handled in memory only by this scaffold; no disk writes, provider transmission, or image logging are implemented. Clearing a Buffer does not guarantee that all JavaScript string copies are erased from process memory.
- These unit tests do not replace a deployed Vercel integration test, malware/content scanning, authentication, abuse monitoring, or a privacy/legal review.

## Rate-limiter adapter — implemented, not activated

`lib/rate-limit.js` defines an adapter around an injected shared/durable store. Its `consume(key, limit, windowSeconds)` operation must be atomic across serverless instances and regions. There is deliberately no in-memory fallback.

- Missing store configuration, weak/missing HMAC secret, missing identity, invalid store response, and store errors all fail closed.
- Identifiers are HMAC-SHA256 hashed before becoming store keys; raw identifiers are not written into the key.
- Prefer a stable authenticated user ID. If an IP fallback is later used, document its purpose, retention, proxy-trust rules, and privacy notice.
- The adapter is unit-tested with fake stores only. No Redis/KV vendor, credentials, network connection, endpoint wiring, or live quota is configured.
- The endpoint does not yet enforce this adapter. Authentication and a production shared-store implementation must be reviewed and tested before public image processing is enabled.

## Authentication guard — implemented, not activated

`lib/auth-guard.js` accepts only a server-attached `request.auth` principal. It checks the authenticated flag, subject, exact issuer, expected audience, and expiry. It never trusts a user ID supplied through request JSON or headers.

- This guard does not verify JWT signatures and must not be used as a substitute for a vetted identity-provider SDK or trusted server middleware.
- The future middleware must validate signature, issuer, audience, expiry, and relevant claims before attaching `request.auth`.
- No login provider, OAuth client, session cookie, secret, user database, or external authentication service is configured.
- The guard is not wired into the image endpoint yet; that endpoint remains disabled.

## Private upload policy — implemented, not activated

`lib/upload-policy.js` validates a server-attached authenticated principal, durable consume-once upload intent, ownership, expiry, allowed MIME, byte limits, and exact server-generated private object key. The store is injected and must provide atomic consume-once semantics across serverless instances.

- Tests use fake stores only. There is no storage SDK, bucket, signed upload URL, intent-creation endpoint, file-signature/decoder validation, cleanup job, or live upload flow.
- The 3 MiB policy ceiling matches the existing image-processing scaffold. The actual object size and file signature must be checked again after upload, before processing.
- Client filenames and client-provided URLs are never used as storage destinations. Never fetch arbitrary client URLs.
- The recommended architecture and mandatory activation controls are in `UPLOAD_SECURITY.md`.

## Image validation — implemented, not wired

`lib/image-validation.js` inspects JPEG SOF, PNG IHDR, and WebP headers from actual Buffer bytes; checks MIME agreement, dimensions, 3 MiB size, 12,000-pixel side limit, and 40-megapixel limit.

- Header parsing is not full decoding and does not prove that every byte is safe or that the file is visually valid.
- The PNG fixture is a minimal header fixture, not a complete decodable PNG. These tests do not measure image quality.
- Before activation, add a maintained hardened decoder in an isolated resource-limited processing boundary, verify actual stored bytes, and safely re-encode.
- The module is not wired into the endpoint. Provider calls remain disabled.

## Face/photo quality policy — implemented, not wired

`lib/face-quality-policy.js` consumes normalized analyzer measurements and returns advisory issue codes and retake suggestions. It checks face count and framing plus optional sharpness, exposure, clipping and background-uniformity scores.

- Prefer on-device analysis. No face detector dependency or external provider is included.
- No identity recognition, face matching, age/gender/emotion inference, embeddings, or biometric-template storage is implemented.
- Thresholds are configurable engineering heuristics, not official passport/visa standards. Missing metrics are reported as not assessed.
- The policy does not crop, retouch, regenerate or alter the photo, and it cannot certify government acceptance.
- Unit tests exercise policy logic only; they do not validate a detector's real-world accuracy or official document compliance.

## Deployment boundary

- Keep this work on `backend-blueprint-no-api-keys` until reviewed.
- Do not merge or promote to production without explicit approval.
- No provider credentials or API calls are part of this branch.


## Verified document rules — implemented in preview UI

`lib/document-rules.js` contains a limited official-source registry for selected India, U.S., UK, Canada and Australia passport/visa routes. Each route has its own source URL and checked date; unsupported combinations return no rule instead of guessed dimensions.

- The preview UI displays the selected route's official-source summary and warning.
- Routes whose authority requires an original/unaltered photo block PassportAI crop/resize export for official use.
- India coverage is limited to the under-4 printed photo route and the ordinary adult PSK/POPSK photo-not-required instruction.
- U.S. visa dimensions are limited to the State Department's generic digital-image specifications; visa-specific workflow requirements may differ.
- Australia guidance recommends a professional provider and warns against mobile photo apps.
- This is a limited rules snapshot, not comprehensive global coverage or an acceptance guarantee. Recheck sources before release.
- Tests validate lookup, route isolation, no-fallback behavior, and export-block flags; they do not certify legal interpretation.
