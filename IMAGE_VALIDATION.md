# PassportAI image validation engine

**Status: validation module and unit-test fixtures only. It is not wired into the upload endpoint and does not enable image processing.**

## Checks implemented

`lib/image-validation.js` inspects actual Buffer bytes rather than trusting a filename or client MIME claim. It recognizes PNG IHDR, JPEG SOF markers, and WebP RIFF/VP8X/VP8/VP8L headers; checks declared MIME consistency; extracts dimensions; rejects malformed headers, zero dimensions, files over 3 MiB, dimensions above 12,000 pixels on either side, and images above 40 megapixels.

## Important limitations

- Header checks are not a complete image decode. A crafted file may contain valid leading headers but corrupt or malicious content later.
- The PNG test fixture intentionally covers the header gate only; it is not a full decodable PNG and does not demonstrate visual quality.
- Before public activation, use a maintained, hardened image decoder in an isolated processing boundary, enforce decoder time/memory limits, reject trailing/polyglot content where feasible, and re-encode into a safe canonical format.
- Validate actual stored object byte count and content again after upload. Never rely only on storage metadata or the browser's MIME value.
- Do not send files to Photoroom, BRIA, or another provider until the user has approved the provider, price, retention terms, and third-party photo consent flow.
- This module is not wired to the existing API route; the provider remains disabled.

## Current limits

- Maximum file size: 3 MiB (kept consistent with the existing scaffold).
- Maximum width or height: 12,000 pixels.
- Maximum total pixels: 40 megapixels.
- Accepted types: JPEG, PNG, WebP.

## Release boundary

All work remains on `backend-blueprint-no-api-keys` and PR #6. No production branch, frontend, storage provider, bucket, credentials, or deployment configuration is changed.
