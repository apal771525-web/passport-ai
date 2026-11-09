// Official-source registry. Unknown routes intentionally return no rule.
export const RULES_VERIFIED_ON = "2026-11-09";
const rules = {
  "India|passport-minor-under4": {
    country:"India", route:"passport-minor-under4", label:"India — passport photo for child under 4 (printed)",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"Passport Seva, Ministry of External Affairs",
    sourceUrl:"https://passportindia.gov.in/AppOnlineProject/pdf/GUIDELINES%20FOR%20CAPTURING%20PHOTOGRAPHS%20FOR%20MINORS_v2.1.pdf",
    requirements:["Printed photo: 45 × 35 mm (4.5 × 3.5 cm).","Plain white background.","For children below 4, the official guideline says the face should occupy about 80–85% of the photograph.","Full face, front view; natural skin tone and even lighting."],
    warning:"This route is only for applicants below 4 years. Confirm the current appointment instructions with Passport Seva. The app cannot guarantee acceptance.",
    officialExportBlocked:false
  },
  "India|passport-psk-adult": {
    country:"India", route:"passport-psk-adult", label:"India — ordinary passport at PSK/POPSK (adult)",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"Passport Seva application instructions",
    sourceUrl:"https://passportindia.gov.in/pdf/ApplicationformInstructionBooklet-V3.0.pdf",
    requirements:["The official instruction booklet says a photograph is not required for applications submitted at a Passport Seva Kendra (PSK) or Post Office Passport Seva Kendra (POPSK).","Other collection-centre routes may have separate photo instructions."],
    warning:"Check the instructions for your exact appointment centre. Do not create a photo unless your application route asks for one.",
    officialExportBlocked:false
  },
  "United States|passport-paper": {
    country:"United States", route:"passport-paper", label:"United States — passport photo for paper application",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"U.S. Department of State — Passport Photos",
    sourceUrl:"https://travel.state.gov/en/passports/apply/help/photos.html",
    requirements:["Printed photo: 2 × 2 inches (51 × 51 mm).","Plain white or off-white background; face centred and fully visible.","Submit an original, unedited photo; digital changes and filters are not allowed."],
    warning:"PassportAI crops/resizes and therefore creates an edited derivative. Official export is disabled for this route; use an unchanged original and follow the State Department instructions.",
    officialExportBlocked:true
  },
  "United States|passport-online": {
    country:"United States", route:"passport-online", label:"United States — online passport renewal",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"U.S. Department of State — Uploading a Digital Photo",
    sourceUrl:"https://travel.state.gov/en/passports/renew-replace/online/upload-digital-photo.html",
    requirements:["Use a recent colour photo with the face and shoulders centred.","Plain white or off-white background and even lighting.","Submit the original, unedited photo without filters or digital changes."],
    warning:"PassportAI's crop/resize export is an edited copy. Official export is disabled; use the original, unchanged photo in the government application.",
    officialExportBlocked:true
  },
  "United States|visa-digital": {
    country:"United States", route:"visa-digital", label:"United States — visa digital photo",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"U.S. Department of State — Digital Image Requirements",
    sourceUrl:"https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos/digital-image-requirements.html",
    requirements:["Square image; 600 × 600 px minimum and 1,200 × 1,200 px maximum.","JPEG format; file size no more than 240 KB.","The exact visa workflow may impose additional photo requirements."],
    warning:"Check the specific visa category and application instructions. This registry does not verify head-size, expression or acceptance for every visa route.",
    officialExportBlocked:false
  },
  "United Kingdom|passport-digital": {
    country:"United Kingdom", route:"passport-digital", label:"United Kingdom — digital passport application",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"GOV.UK — Get a passport photo",
    sourceUrl:"https://www.gov.uk/photos-for-passports",
    requirements:["At least 600 × 750 pixels; file size 50 KB–10 MB.","Plain light-coloured background; clear, in focus and in colour.","If taken on your own device, include head, shoulders and upper body; do not crop — the application process crops it.","Photo must be unaltered by computer software."],
    warning:"PassportAI's crop/resize export is altered and must not be used for this official route. Use your original image or an approved photo-booth/shop code.",
    officialExportBlocked:true
  },
  "United Kingdom|passport-paper": {
    country:"United Kingdom", route:"passport-paper", label:"United Kingdom — printed passport application",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"GOV.UK — Printed passport photo requirements",
    sourceUrl:"https://www.gov.uk/photos-for-passports/photo-requirements",
    requirements:["Printed photo: 45 mm high × 35 mm wide.","Head height from crown to chin: 29–34 mm.","Professional-standard colour print on plain white photographic paper; photo must be unaltered."],
    warning:"PassportAI's crop/resize export is an edited derivative. Use an unaltered photo from a photo booth or professional provider.",
    officialExportBlocked:true
  },
  "Canada|passport-paper": {
    country:"Canada", route:"passport-paper", label:"Canada — printed passport application",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"Government of Canada — Passport photo requirements",
    sourceUrl:"https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html",
    requirements:["Two identical, unaltered photos; 50 mm wide × 70 mm high.","Face height from chin to crown: 31–36 mm.","Taken in person by a commercial photographer or photo studio and professionally printed."],
    warning:"Canada explicitly prohibits cropping, background changes and other edits. PassportAI official export is disabled; use a professional photographer's unaltered original.",
    officialExportBlocked:true
  },
  "Canada|passport-online": {
    country:"Canada", route:"passport-online", label:"Canada — online passport renewal (digital photo)",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"Government of Canada — Passport photo requirements, online renewals",
    sourceUrl:"https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html",
    requirements:["JPEG/JPG, portrait orientation, 3:2 aspect ratio.","1,200 × 1,800 px minimum; 3,000 × 4,500 px maximum.","File size 200 KB–5 MB; chin-to-crown height 45–50% of image height.","Use the original file captured by the camera; do not submit an edited or scanned photo."],
    warning:"PassportAI's crop/resize export is an edited copy. Official export is disabled; obtain the original digital file from a commercial photographer.",
    officialExportBlocked:true
  },
  "Australia|passport-paper": {
    country:"Australia", route:"passport-paper", label:"Australia — passport photo (printed)",
    verifiedOn:RULES_VERIFIED_ON, sourceLabel:"Australian Passport Office — Passport photo guidelines",
    sourceUrl:"https://www.passports.gov.au/passports-explained/how-apply/passport-photo-guidelines",
    requirements:["Photo size: 35–40 mm wide × 45–50 mm high.","Face height from chin to crown: 32–36 mm.","Good-quality colour print, plain white or light grey background, even lighting; no retouching."],
    warning:"The Australian Passport Office does not recommend online passport-photo services or mobile apps due to identity-fraud risk. Prefer a professional provider.",
    officialExportBlocked:false
  }
};

export function getDocumentRule(country, route) {
  if (typeof country !== "string" || typeof route !== "string") return null;
  return rules[country + "|" + route] || null;
}
export function getAvailableRoutes(country) {
  return Object.values(rules).filter(rule => rule.country === country).map(({route,label}) => ({route,label}));
}
