# PassportAI backend scaffold tests and security notes

These tests use Node.js built-in `node:test` and require no third-party packages.

Run from the repository root:

```sh
node --test
```

The suite covers method and content-type rejection, same-origin checks, malformed input, base64 validation, MIME/signature mismatch, HTTP and image size limits, privacy/security headers, and the expected disabled-provider response.

## Security boundary

- The endpoint is intentionally disabled and does not call Photoroom, BRIA, or any other provider.
- The small PNG fixture checks only the file-signature gate; it is not a complete decodable image and does not test image quality.
- Same-origin validation is a browser-request guard, not user authentication. Requests without an Origin header are allowed for server-to-server clients.
- Request body parsing is limited by the Vercel function configuration; the handler also rejects a declared Content-Length above 4 MiB.
- The image payload is handled in memory only by this scaffold; no disk writes, provider transmission, or image logging are implemented. Clearing a Buffer does not guarantee that all JavaScript string copies are erased from process memory.
- These unit tests do not replace a deployed Vercel integration test, malware/content scanning, authentication, abuse monitoring, or a privacy/legal review.

## Rate limiting: production requirement

A reliable rate limiter must use a shared, durable store (for example, a managed Redis/KV service) so limits apply across serverless instances and regions. An in-memory counter is not sufficient on serverless platforms and must not be presented as production protection. The provider-disabled scaffold deliberately does not pretend that rate limiting is active. Before enabling image processing publicly, add a shared-store limiter, per-user/session quotas, IP abuse controls with a documented retention policy, and alerting. Fail closed if the limiter is unavailable.

## Deployment boundary

- Keep this work on `backend-blueprint-no-api-keys` until reviewed.
- Do not merge or promote to production without explicit approval.
- No provider credentials or API calls are part of this branch.
