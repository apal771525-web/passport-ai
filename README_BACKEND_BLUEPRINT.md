# PassportAI — Secure Background API Blueprint

## Safety status

Blueprint scaffold only. No provider API is called, no API key is required, no image is sent to a third party, and background removal is deliberately disabled. The endpoint validates a small image request and returns HTTP 503 with PROVIDER_NOT_CONFIGURED.

This branch is based on main. It does not modify main, the existing feature/ai-background-removal branch, or any production deployment.

## Current architecture

- Existing static UI remains unchanged.
- api/remove-background.js: Vercel Node.js serverless endpoint.
- lib/provider-config.js: server-only provider selection/configuration.
- .env.example: variable names only; contains no secrets.

The endpoint accepts POST JSON with imageBase64 and mimeType fields. It validates method, content type, allowed MIME types, base64 syntax, maximum 3 MiB payload, and JPEG/PNG/WebP file signatures. It sets no-store headers and does not write files to disk.

## Future provider adapter contract

Implement adapters only after reviewing current official API documentation, pricing, data-processing agreement, retention policy, and commercial terms.

Recommended internal contract:
- Input: imageBuffer, mimeType, requestId.
- Output: normalized PNG with alpha (or documented matte format), provider name, and duration.
- Read credentials only from server-side environment variables.
- Use HTTPS and a fixed provider hostname; never accept a user-supplied URL.
- Apply request timeouts and bounded retries; never blindly retry billable requests.
- Never log image bytes, base64, API keys, request bodies, or signed URLs.
- Map upstream errors to safe client error codes.
- Do not persist source images by default.

## Vercel environment variables — NOT CONFIGURED

After provider selection and explicit approval, configure these in Vercel Project Settings > Environment Variables:
- BACKGROUND_PROVIDER=disabled|photoroom|bria
- BACKGROUND_API_ENABLED=false (keep false until approved)
- PHOTOROOM_API_KEY (only if Photoroom is selected)
- BRIA_API_KEY (only if BRIA is selected)

Do not put credentials in GitHub, source files, client-side JavaScript, screenshots, or chat messages. Keep Preview and Production variables separate.

## Important implementation decisions before activation

- Current base64/JSON transport is capped at 3 MiB (body parser limit 4 MiB). For larger mobile photos, design a multipart or short-lived upload flow only after evaluating platform limits, storage, and deletion guarantees.
- Add durable rate limiting and per-user quotas before any paid provider call. In-memory counters are unreliable across serverless instances.
- Add authentication/abuse controls and a monthly spend cap.
- Obtain explicit consent before transmitting identity photos to a provider.
- Avoid analytics/session replay on upload and result screens.
- Country/document editing policy must be grounded in current official rules. Disable edits where prohibited.
- Never alter facial identity, geometry, skin, expression, or biometric features.
- Never guarantee government acceptance.

## Test plan before enabling

1. Unit-test file signature validation and invalid base64 rejection.
2. Test unsupported methods, MIME types, malformed payloads, and files over 3 MiB.
3. Confirm all valid requests return PROVIDER_NOT_CONFIGURED while disabled.
4. Inspect Vercel logs to confirm no image data or secrets are logged.
5. After separately approved provider integration, use consented non-identity test portraits and compare hair, glasses, shoulder edges, background cleanliness, latency, failure rate, and billed cost.
6. Keep provider disabled until test results and privacy review are approved.

## Deployment boundary

A Vercel Preview deployment may be generated automatically for this branch/PR. That is not production. Do not merge this branch, change domains, or alter production environment variables without explicit user approval.
