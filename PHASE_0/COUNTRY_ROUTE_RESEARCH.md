# Country and Document Route Research — Phase 0

**Research date:** 17 November 2026  
**Status:** Initial official-source scan; rules must be rechecked before implementation and each release.  
**Important:** Planning research, not legal advice or a guarantee of acceptance.

## Core product rule

A country alone is not enough to select photo rules. Requirements can differ by document (passport, visa, ID, residence permit, driving licence), application channel (online, paper, consular submission, renewal), applicant category, issuing authority, and location.

The product must ask for the exact route before applying a preset. Unknown or ambiguous routes must fail safely: provide neutral capture guidance, avoid editing, and label the route unverified.

## Initial route matrix

| Country / authority | Route identified | Key requirements surfaced | Product consequence |
|---|---|---|---|
| United States — Department of State | Passport photo for paper application; online renewal is a separate digital route | Official guidance says submit an original, unchanged photo; do not use software, apps, filters, or AI to alter it. Paper photo is 2 x 2 inches; head height 25–35 mm. Neutral expression, direct camera view, plain white/off-white background. | Do not offer AI background removal, retouching, or generated alterations on this route. Distinguish paper print dimensions from online upload requirements. |
| United Kingdom — HM Passport Office | Digital passport application | Digital photo must be unaltered; at least 600 x 750 px and 50 KB–10 MB. Plain light-coloured background, no other people/objects, no red-eye; face forward, neutral expression, eyes visible. | Preserve original image. Do not crop uploaded digital image if official application process says it will crop it. |
| United Kingdom — HM Passport Office | Printed passport application | Two identical printed photos; 45 mm high x 35 mm wide; head height 29–34 mm; professional print on plain white photographic paper. | Separate print route from digital upload route. |
| Canada — IRCC / Passport Program | Adult new passport or renewal in person/by mail | Two identical unaltered photos; 50 x 70 mm; face height 31–36 mm; professional studio photo and photographic paper. AI tools, filters, technical enhancements, cropping, and background changes are described as alterations. | Do not process/alter image for this route. Studio workflow and photographer details may be required. |
| Canada — IRCC / Passport Program | Online adult passport renewal | Official page says digital requirements differ; JPEG; 3:2 portrait; 1,800–4,500 px high and 1,200–3,000 px wide; 200 KB–5 MB; chin-to-crown 45–50% of image height; file saved directly from original camera capture. | Build as a distinct route. Preserve original camera file; validate dimensions and file size. Confirm what file transformations are permissible before implementation. |
| India — Passport Seva | Passport Seva Kendra (PSK) / Post Office PSK application | Passport application instruction booklet states a photograph is not required for applications submitted at PSK/POPSK. | Do not imply a photo file is required for every domestic India PSK application. Ask application centre/route first. |
| India — other collection centres / consular missions | Requirements can differ | An Indian mission page describes a 2 x 2 inch photo, plain light background, natural skin tone, neutral expression, and face occupying 70–80%; this is mission guidance, not a universal India domestic rule. | Treat mission-specific guidance as a separately sourced route. Do not generalise one embassy page to all India applicants or PSKs. |

## EU / Europe status

**Not ready for a single “EU passport photo” preset.** Passport issuance is handled by individual countries, and requirements can vary by member state, document and application channel. Do not publish a generic EU compliance preset. Select specific issuing countries and official authority sources first.

## Source registry — initial official sources

| Authority / source | URL | Research note |
|---|---|---|
| U.S. Department of State — Passport Photos | https://travel.state.gov/en/passports/apply/help/photos.html | Original unchanged photo and paper photo requirements. |
| U.S. Department of State — Online passport renewal | https://travel.state.gov/content/travel/en/passports/have-passport/renew-online.html | Separate online renewal route; exact upload specifications need further capture. |
| GOV.UK — Digital passport photos | https://www.gov.uk/photos-for-passports | Digital photo rules, dimensions, file size and appearance. |
| GOV.UK — Printed passport photos | https://www.gov.uk/photos-for-passports/photo-requirements | Printed photo size and head measurement. |
| Canada.ca — Passport photo requirements | https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html | Printed and digital route distinctions. |
| Passport Seva — Application instruction booklet | https://passportindia.gov.in/pdf/ApplicationformInstructionBooklet-V3.0.pdf | Photo not required at PSK/POPSK; route-specific exceptions noted. |
| Embassy of India, Buenos Aires — Photo guidelines | https://www.indembarg.gov.in/page/photo-guidelines-for-india-passport/ | Mission-specific guidance; do not generalise to all India routes. |

## Required compliance data model

Every rule record should include:
- country code, issuing authority, document type, application channel, and applicant category;
- rule identifier and human-readable requirement;
- rule type (hard constraint, advisory, route-dependent);
- allowed and prohibited operations;
- technical parameters (dimensions, ratio, file type, file size, face geometry);
- official source URL and title;
- source checked date and effective dates where known;
- review status (draft, verified, expired, withdrawn), reviewer, and change history.

## Safe product behaviour

1. Never silently switch a user to a different route or country preset.
2. If the authority prohibits editing, disable editing tools and retain the original.
3. Separate capture coaching from image editing. Capture coaching can guide lighting, pose, distance and background before capture.
4. Separate technical validation (pixels, dimensions, file size, file type) from visual estimation (face position, shadows, expression).
5. Explain that automated visual checks can be wrong and cannot decide government acceptance.
6. If the official source is unavailable, unclear, or stale, mark the route “requirements need verification” and do not claim compliance.
7. Record source changes and rerun affected test fixtures when requirements change.

## Open research required before launch

- US online renewal exact digital specifications and permitted processing boundaries.
- India domestic PSK/POPSK versus other collection centre, passport camps, and overseas consular mission routes.
- India visa photo requirements by destination country and visa category.
- Canada online renewal details and whether third-party prepared files remain acceptable under original-camera-file requirements.
- Select initial European countries individually and research each official national authority.
- Child and infant exceptions for every launch route.
- Accessibility and religious/medical exceptions by route.
