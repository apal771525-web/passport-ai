# PassportAI backend scaffold tests

These tests use Node.js built-in `node:test` and require no third-party packages.

Run from the repository root:

```sh
node --test
```

The suite covers method and content-type rejection, malformed input, base64 validation, MIME/signature mismatch, the 3 MiB image limit, no-store/security headers, and the expected disabled-provider response.

## Important scope

- The endpoint is intentionally disabled and does not call Photoroom, BRIA, or any other provider.
- The small PNG fixture checks only the file-signature gate; it is not a complete decodable image and does not test image quality.
- These are unit-level handler tests with mocked request/response objects. They do not replace a deployed Vercel integration test, dependency/security scanning, abuse/rate-limit testing, or a privacy review.
- No API keys, provider calls, production deployment, or production changes are part of this test setup.
