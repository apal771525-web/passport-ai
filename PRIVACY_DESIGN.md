# Privacy Design

## Data sensitivity

Passport, visa and identity photos are sensitive personal information. Design for data minimization and local processing wherever practical.

## Current implementation status

The current prototype has no configured production backend, account system, database or durable upload storage. The photo workflow is primarily browser-side. Optional MediaPipe libraries/models may be fetched from third-party hosts when invoked, so do not describe the entire page as network-free or make an absolute “no data leaves the device” claim without network verification.

## Required principles

- Do not upload or transmit a photo unless the user has clear notice and gives informed consent.
- Do not use user photos for AI/model training.
- Do not log image bytes, face data, raw EXIF metadata or sensitive upload content.
- Avoid biometric templates, face embeddings and identity recognition.
- Prefer in-memory/object-URL processing and revoke temporary URLs when finished.
- Define retention periods and secure deletion before introducing storage.
- Provide a clear deletion path for accounts and any retained uploads.
- Use HTTPS, least-privilege access and short-lived authorization for any future upload service.
- Assess every third-party script/model and disclose relevant processing.

## Before enabling backend or providers

Complete a privacy impact review, data-flow diagram, consent UX, processor/vendor review, retention schedule, incident plan and jurisdiction-specific legal review. Keep all external processing disabled until approved.
