# Passport AI — Security and Privacy Requirements

**Status:** Requirements draft. This is not a security certification, legal opinion, or completed penetration test.

## 1. Data classification

Passport and identity-document photographs are sensitive personal information. Face images should be treated as high-risk data even when a particular legal regime does not classify every photograph as biometric special-category data.

Do not collect or infer identity attributes that are not necessary for the user-requested photo-preparation task.

## 2. Privacy-by-default requirements

- Prefer in-browser processing.
- Do not upload a photo merely to run a check that can run locally.
- If upload is necessary, explain purpose, recipient/service provider, retention period, and deletion process before upload.
- Do not retain source photos by default.
- Do not log image bytes, base64 data, face landmarks, face embeddings, or EXIF/GPS data.
- Strip unnecessary metadata from exports.
- Provide clear consent and a way to abandon processing.
- Provide deletion controls for any retained user data.
- Establish separate safeguards for children and guardian workflows.
- Review all third-party model/CDN requests and disclose external processing or downloads.

## 3. Application security requirements

- Validate file signatures and decode files server-side if any server upload is introduced.
- Enforce file-size, pixel-count, format, and processing-time limits.
- Use safe temporary storage with short retention and automatic cleanup.
- Protect APIs with authentication where required, authorization checks, rate limits, and abuse monitoring.
- Keep secrets in managed environment variables; never commit secrets or expose them to client bundles.
- Apply secure headers, HTTPS, dependency updates, and least-privilege access.
- Use CSRF protection where cookie-authenticated state-changing requests require it.
- Avoid arbitrary remote URL fetching from user-supplied inputs.
- Maintain an incident response and breach-notification process before production.

## 4. AI and model safety

- No face recognition, identity matching, or face embedding retention in the initial scope.
- Evaluate model licensing, hosting, security, performance, and data flows before adoption.
- Clearly distinguish automated quality assistance from official document approval.
- Provide uncertainty and actionable recapture instructions.
- Do not use generative alteration on routes that require original/unaltered photographs.

## 5. Legal and policy review

Before launch, obtain qualified review of applicable privacy and consumer laws for each target market, including India and relevant destination markets. Confirm controller/processor roles, lawful basis/consent, children's data rules, retention, user rights, vendor contracts, and cross-border transfers.

Do not claim compliance with a law solely because a privacy notice exists.

## 6. Release blockers

Production launch is blocked until:
- Data-flow and third-party service inventory is complete.
- Upload and deletion behaviour is tested.
- Secrets and dependency scans are clean or formally accepted.
- Authentication/authorization is tested if accounts exist.
- Security headers and transport security are verified.
- Privacy notice and consent match actual behaviour.
- Incident handling and support ownership are documented.
