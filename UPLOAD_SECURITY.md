# Secure upload and temporary image handling blueprint

**Status: design contract only. No storage provider, bucket, credentials, upload URL, or endpoint is configured.** This work does not change the frontend, existing image endpoint, main branch, or production.

## Recommended future flow

1. The browser authenticates through a vetted identity provider. Trusted server middleware verifies the session/token and attaches a principal; client JSON and headers are not identity.
2. The server creates a cryptographically random, short-lived upload intent in a durable store. Bind it to the authenticated user, exact MIME type, maximum bytes (3 MiB), expiry, and a server-generated private object key.
3. The server issues a narrowly scoped, short-expiry upload authorization for exactly that object key and content type. The browser must not choose a bucket, object key, or arbitrary destination URL.
4. The browser uploads directly to private object storage. Do not proxy large base64 payloads through a serverless function unless platform limits and memory use have been measured.
5. A trusted backend consumes the intent atomically once, verifies ownership, expected object key, content type, actual object size, and file signature, then processes only that private object through an approved provider adapter.
6. Return the result through a short-lived authorized download path. Keep source and output private; delete them after a short documented TTL and also run a cleanup job for abandoned uploads.

## Mandatory controls before activation

- Use private buckets/containers only; public listing and public object access remain disabled.
- Use generated object keys, never client filenames or user-provided URLs. Never fetch arbitrary URLs supplied by a client (SSRF risk).
- Upload authorization must be single-object, single-use, least-privilege, and expire quickly (recommended initial target: 5 minutes).
- Intent records must be stored in a durable shared store with atomic consume-once semantics. No process-memory fallback.
- Enforce the 3 MiB limit at the storage upload policy and again against the actual stored object. Check file signatures/decodability server-side; MIME metadata alone is not proof.
- Allow only JPEG, PNG, and WEBP at the upload boundary. Reject SVG, archives, and unknown formats.
- Keep images out of logs, analytics, error traces, public URLs, and repository files. Avoid logging signed URLs or authorization headers.
- Encrypt in transit and at rest; restrict service credentials to one private bucket/prefix and required operations only.
- Apply per-user and IP abuse controls, quotas, malware/content scanning where appropriate, and alerting. Fail closed if auth, intent storage, validation, or rate limiting is unavailable.
- Define deletion TTLs for originals, outputs, backups, and provider-side copies. Verify provider retention and cross-region handling before sending any image to an AI service.
- Obtain clear user consent before any third-party processing. Do not use identity-document photos as initial quality-test samples.

## Current code contract

`lib/upload-policy.js` validates a server-side principal, one-time intent, expiry, owner, allowed MIME, content length, intent-specific size, and exact server-generated object key. Its injected `store.consumeOnce(id)` must atomically consume an intent across instances. Tests use a fake store only.

This is not a storage SDK, signed-URL generator, file-signature scanner, authentication system, or deployed upload service. The current `api/remove-background.js` remains disabled and unchanged. No upload is possible from this blueprint alone.

## Platform and provider selection gate

Before choosing a storage provider, verify current Vercel request/function limits, storage maximum object size, signed upload policy capabilities, lifecycle deletion behavior, region/residency, pricing, and data-processing terms. Do not assume a Vercel function can safely receive arbitrary image payloads. Record the verified limits and run an integration test in Preview only.

## Release boundary

Keep this blueprint on `backend-blueprint-no-api-keys`. Do not wire storage, create a bucket, add credentials, activate a provider, merge, or promote to Production without explicit user approval.
