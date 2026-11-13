# Privacy Design

## Design principles
- Local processing whenever possible.
- No unnecessary photo storage.
- No image bytes in logs.
- No biometric templates or face embeddings.
- No identity recognition.
- No third-party AI training without explicit consent.
- No external processing unless approved.

## Current implementation stance
The current prototype remains browser-local and does not send uploaded photos to a live backend.

## Future privacy controls that are proposed but not implemented
- Time-limited upload authorization tokens.
- Private storage architecture for user uploads.
- Secure deletion and retention windows.
- Consent requirements for any external processing.
- Data deletion workflows for accounts and uploads.

## Retention guidance
- Do not retain user photos beyond the active editing session unless an explicit, approved requirement exists.
- Do not log image bytes, raw EXIF metadata, or uploaded content.
- Any real storage path requires a privacy review and clear retention policy.
