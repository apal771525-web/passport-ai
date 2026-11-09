# Verified country/document rules registry

Registry verification date: 2026-11-09. Each rule is tied to an official government source URL and an exact application route. Unknown country/route combinations intentionally return no rule; no generic passport dimensions are guessed.

## Coverage
- India: passport photo for a child below 4; ordinary adult application at PSK/POPSK (photo not required according to the linked application instructions).
- United States: paper passport, online passport renewal, digital visa photo.
- United Kingdom: digital and printed passport routes.
- Canada: printed passport and online renewal.
- Australia: printed passport photo.

## Safety behavior
- Routes whose official guidance requires an original/unaltered image are marked `officialExportBlocked`; the preview UI disables PassportAI's crop/resize export for those routes.
- This is not a government approval service. The registry does not cover every age group, visa class, emergency/overseas application, consular post or regional exception.
- Australia warns against online passport-photo services/mobile apps; the UI recommends a professional provider.
- Rules must be rechecked before each release. A source page changing does not automatically update this local snapshot.
- Unknown routes show "not verified"; the app must never infer a size or acceptance rule from another country.

## Sources
- India Passport Seva minor-under-4 photo guideline: https://passportindia.gov.in/AppOnlineProject/pdf/GUIDELINES%20FOR%20CAPTURING%20PHOTOGRAPHS%20FOR%20MINORS_v2.1.pdf
- India Passport Seva application instructions: https://passportindia.gov.in/pdf/ApplicationformInstructionBooklet-V3.0.pdf
- U.S. passport photos: https://travel.state.gov/en/passports/apply/help/photos.html
- U.S. online passport photo: https://travel.state.gov/en/passports/renew-replace/online/upload-digital-photo.html
- U.S. visa digital image: https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos/digital-image-requirements.html
- UK digital passport: https://www.gov.uk/photos-for-passports
- UK printed passport: https://www.gov.uk/photos-for-passports/photo-requirements
- Canada passport photos: https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html
- Australia passport photo guidelines: https://www.passports.gov.au/passports-explained/how-apply/passport-photo-guidelines
