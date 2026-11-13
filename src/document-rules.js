export const COUNTRY_REQUIREMENTS = Object.freeze({
  India: {
    'passport-child-under-4': {
      country: 'India',
      documentType: 'Passport (child under 4)',
      digitalOrPrinted: 'Printed',
      requiredDimensions: '35 mm × 45 mm',
      backgroundRequirements: 'White background.',
      facePositioning: 'Head and shoulders should be clearly visible in the frame.',
      sourceAuthority: 'Passport Seva / Government of India',
      sourceUrl: 'https://www.passportindia.gov.in/psp/Apply',
      lastVerified: '2026-11-13',
      editingPermitted: false,
      notes: 'Official rule is for a specific route and must be checked against the current application form.'
    }
  },
  'United States': {
    visa: {
      country: 'United States',
      documentType: 'Visa photo',
      digitalOrPrinted: 'Digital',
      requiredDimensions: '600–1,200 px square JPG, 240 KB max',
      backgroundRequirements: 'Plain white or off-white background.',
      facePositioning: 'Head height 50%–69% of image height.',
      sourceAuthority: 'U.S. Department of State',
      sourceUrl: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos/frequently-asked-questions.html',
      lastVerified: '2026-11-13',
      editingPermitted: false,
      notes: 'Use the exact upload workflow for the relevant visa type.'
    },
    passport: {
      country: 'United States',
      documentType: 'Passport photo',
      digitalOrPrinted: 'Printed or digital',
      requiredDimensions: '2 × 2 inches (51 × 51 mm) printed; digital upload must be original, unedited',
      backgroundRequirements: 'Plain white or off-white background.',
      facePositioning: 'Head height 25–35 mm for printed photo; centre head and shoulders.',
      sourceAuthority: 'U.S. Department of State',
      sourceUrl: 'https://travel.state.gov/en/passports/apply/help/photos.html',
      lastVerified: '2026-11-13',
      editingPermitted: false,
      notes: 'This source specifically warns against edited or altered images.'
    }
  },
  'United Kingdom': {
    passport: {
      country: 'United Kingdom',
      documentType: 'Passport photo',
      digitalOrPrinted: 'Digital',
      requiredDimensions: 'Minimum 600 × 750 px, 50 KB–10 MB',
      backgroundRequirements: 'Plain light-coloured background.',
      facePositioning: 'Full head and shoulders; face centred and clear.',
      sourceAuthority: 'GOV.UK',
      sourceUrl: 'https://www.gov.uk/photos-for-passports',
      lastVerified: '2026-11-13',
      editingPermitted: false,
      notes: 'Official guidance states the image must be unaltered.'
    },
    visa: {
      country: 'United Kingdom',
      documentType: 'Visa photo',
      digitalOrPrinted: 'Digital',
      requiredDimensions: 'Minimum 600 × 750 px, 50 KB–6 MB',
      backgroundRequirements: 'Plain light-coloured background.',
      facePositioning: 'Face must be clear, full head and shoulders.',
      sourceAuthority: 'UK Visas and Immigration',
      sourceUrl: 'https://www.gov.uk/guidance/how-to-take-a-photo-for-a-visa-application-or-permission',
      lastVerified: '2026-11-13',
      editingPermitted: false,
      notes: 'Altering the photo is not permitted.'
    }
  },
  Canada: {
    passport: {
      country: 'Canada',
      documentType: 'Passport photo',
      digitalOrPrinted: 'Printed or digital',
      requiredDimensions: 'Printed: 50 × 70 mm; Digital: 1,200 × 1,800 px minimum, 200 KB–5 MB',
      backgroundRequirements: 'Plain white or light-coloured background.',
      facePositioning: 'Chin-to-crown height 31–36 mm for printed photo; 45%–50% of image height for digital photo.',
      sourceAuthority: 'Government of Canada',
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html',
      lastVerified: '2026-11-13',
      editingPermitted: false,
      notes: 'The official guidance requires unaltered photos.'
    }
  },
  Australia: {
    passport: {
      country: 'Australia',
      documentType: 'Passport photo',
      digitalOrPrinted: 'Printed',
      requiredDimensions: '35–40 mm × 45–50 mm',
      backgroundRequirements: 'Plain white or light grey background.',
      facePositioning: 'Face height 32–36 mm from chin to crown.',
      sourceAuthority: 'Australian Passport Office',
      sourceUrl: 'https://www.passports.gov.au/PhotoGuidelines',
      lastVerified: '2026-11-13',
      editingPermitted: false,
      notes: 'Australian guidance warns against third-party photo apps and retouching.'
    }
  }
});

export function getCountryRequirements(country, documentType) {
  if (!country || !documentType) {
    return {
      supported: false,
      status: 'unsupported',
      reason: 'Country and document type are required.'
    };
  }

  const countryEntry = COUNTRY_REQUIREMENTS[country];
  if (!countryEntry) {
    return {
      supported: false,
      status: 'unsupported',
      reason: `No verified requirements have been loaded for ${country}.`
    };
  }

  const normalizedDocumentType = documentType.trim().toLowerCase();
  const requirement = Object.values(countryEntry).find((item) => {
    const candidate = item.documentType.toLowerCase();
    return candidate.includes(normalizedDocumentType) || normalizedDocumentType.includes(candidate.replace(/[^a-z]/g, ''));
  });

  if (!requirement) {
    return {
      supported: false,
      status: 'unsupported',
      reason: `The selected ${country} route is not in the verified registry.`
    };
  }

  return {
    supported: true,
    status: 'verified',
    ...requirement
  };
}

export function isEditedExportAllowed(country, documentType) {
  const rule = getCountryRequirements(country, documentType);
  return rule.supported ? rule.editingPermitted !== false : false;
}

export function getUnsupportedRouteStatus(country, documentType) {
  const rule = getCountryRequirements(country, documentType);
  if (rule.supported) {
    return {
      supported: true,
      reason: 'This route is verified and may be edited only if the official requirement permits it.'
    };
  }

  return {
    supported: false,
    reason: 'Unsupported route. No official requirement has been verified for this country/document combination.'
  };
}
