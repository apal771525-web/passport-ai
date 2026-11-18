/** 
 * Fail-closed route-policy engine for official identity-photo workflows.
 * This module authorizes operations only; it does not certify government acceptance.
 */

export const ROUTE_STATUSES = Object.freeze(['verified', 'needs_review', 'unsupported', 'expired', 'retired']);
export const OPERATIONS = Object.freeze([
  'crop', 'rotate', 'resize', 'background_replace', 'colour_adjust', 'exposure_adjust',
  'retouch', 'face_geometry_change', 'synthetic_face_generation', 'compression',
  'metadata_strip', 'print_layout'
]);
export const OUTPUT_CHANNELS = Object.freeze(['digital', 'printed']);
export const ALWAYS_DENIED_OPERATIONS = Object.freeze(['face_geometry_change', 'synthetic_face_generation']);

const DECISION = Object.freeze({
  ALLOW: 'ALLOW',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  ROUTE_AMBIGUOUS: 'ROUTE_AMBIGUOUS',
  ROUTE_NOT_VERIFIED: 'ROUTE_NOT_VERIFIED',
  POLICY_EXPIRED: 'POLICY_EXPIRED',
  POLICY_NOT_EFFECTIVE: 'POLICY_NOT_EFFECTIVE',
  POLICY_SOURCE_MISSING: 'POLICY_SOURCE_MISSING',
  POLICY_CONFLICT: 'POLICY_CONFLICT',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  OUTPUT_CONSTRAINTS_INCOMPLETE: 'OUTPUT_CONSTRAINTS_INCOMPLETE',
  POLICY_VERSION_STALE: 'POLICY_VERSION_STALE',
  INVALID_OPERATION_PLAN: 'INVALID_OPERATION_PLAN'
});

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const positiveIntegerOrNull = (value) => value === null || (Number.isInteger(value) && value > 0);
const positiveNumberOrNull = (value) => value === null || (typeof value === 'number' && Number.isFinite(value) && value > 0);

function isIsoUtc(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function canonicalIdentifier(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

function canonicalRouteKey(route) {
  if (!isRecord(route)) return null;
  return {
    jurisdiction: typeof route.jurisdiction === 'string' ? route.jurisdiction.trim().toUpperCase() : route.jurisdiction,
    authorityId: canonicalIdentifier(route.authorityId),
    documentType: canonicalIdentifier(route.documentType),
    applicationChannel: canonicalIdentifier(route.applicationChannel),
    applicantCategory: route.applicantCategory === null ? null : canonicalIdentifier(route.applicantCategory),
    outputChannel: canonicalIdentifier(route.outputChannel),
    workflowId: route.workflowId === null ? null : canonicalIdentifier(route.workflowId)
  };
}

function validRouteKey(route) {
  if (!isRecord(route)) return false;
  return /^[A-Za-z]{2,3}$/.test(route.jurisdiction ?? '') &&
    nonEmptyString(route.authorityId) &&
    nonEmptyString(route.documentType) &&
    nonEmptyString(route.applicationChannel) &&
    (route.applicantCategory === null || nonEmptyString(route.applicantCategory)) &&
    OUTPUT_CHANNELS.includes(route.outputChannel) &&
    (route.workflowId === null || nonEmptyString(route.workflowId));
}

function routeKeysEqual(left, right) {
  const a = canonicalRouteKey(left);
  const b = canonicalRouteKey(right);
  return Boolean(a && b) && Object.keys(a).every((key) => a[key] === b[key]);
}

function validateConstraints(constraints, outputChannel, errors) {
  if (!isRecord(constraints)) {
    errors.push('constraints must be an object for a verified policy.');
    return;
  }

  const numericFields = [
    'widthPx', 'heightPx', 'minWidthPx', 'maxWidthPx', 'minHeightPx', 'maxHeightPx',
    'maxBytes', 'minBytes', 'printWidthMm', 'printHeightMm', 'dpi'
  ];
  for (const field of numericFields) {
    if (!hasOwn(constraints, field) || !positiveIntegerOrNull(constraints[field])) {
      errors.push(`constraints.${field} must be a positive integer or null.`);
    }
  }
  if (!hasOwn(constraints, 'aspectRatio') || !positiveNumberOrNull(constraints.aspectRatio)) {
    errors.push('constraints.aspectRatio must be a positive number or null.');
  }
  if (!Array.isArray(constraints.allowedFormats) || constraints.allowedFormats.length === 0 ||
      !constraints.allowedFormats.every(nonEmptyString)) {
    errors.push('constraints.allowedFormats must contain at least one non-empty format.');
  }

  if (constraints.minBytes !== null && constraints.maxBytes !== null && constraints.minBytes > constraints.maxBytes) {
    errors.push('constraints.minBytes cannot exceed constraints.maxBytes.');
  }
  if (constraints.minWidthPx !== null && constraints.maxWidthPx !== null && constraints.minWidthPx > constraints.maxWidthPx) {
    errors.push('constraints.minWidthPx cannot exceed constraints.maxWidthPx.');
  }
  if (constraints.minHeightPx !== null && constraints.maxHeightPx !== null && constraints.minHeightPx > constraints.maxHeightPx) {
    errors.push('constraints.minHeightPx cannot exceed constraints.maxHeightPx.');
  }

  if (outputChannel === 'digital') {
    const fixedSize = Number.isInteger(constraints.widthPx) && constraints.widthPx > 0 &&
      Number.isInteger(constraints.heightPx) && constraints.heightPx > 0;
    const boundedSize = ['minWidthPx', 'maxWidthPx', 'minHeightPx', 'maxHeightPx']
      .every((field) => Number.isInteger(constraints[field]) && constraints[field] > 0);
    if (!fixedSize && !boundedSize) errors.push('Digital constraints require fixed width/height or complete min/max pixel bounds.');
    if (!Number.isInteger(constraints.maxBytes) || constraints.maxBytes <= 0) errors.push('Digital constraints require maxBytes.');
  }

  if (outputChannel === 'printed') {
    for (const field of ['printWidthMm', 'printHeightMm', 'dpi']) {
      if (!Number.isInteger(constraints[field]) || constraints[field] <= 0) {
        errors.push(`Printed constraints require ${field}.`);
      }
    }
  }
}

/** Validate a policy record without mutating it. */
export function validatePolicyRecord(policy) {
  const errors = [];
  if (!isRecord(policy)) return { valid: false, errors: ['Policy must be an object.'] };

  if (policy.schemaVersion !== '1.0') errors.push('schemaVersion must be "1.0".');
  if (!nonEmptyString(policy.policyId)) errors.push('policyId is required.');
  if (!Number.isInteger(policy.policyVersion) || policy.policyVersion < 1) errors.push('policyVersion must be a positive integer.');
  if (!validRouteKey(policy.route)) errors.push('route must contain the complete, valid route identity tuple.');
  if (!ROUTE_STATUSES.includes(policy.status)) errors.push('status is not a supported route status.');
  if (!Array.isArray(policy.sources)) errors.push('sources must be an array.');
  if (!Array.isArray(policy.allowedOperations) || !policy.allowedOperations.every((item) => OPERATIONS.includes(item))) {
    errors.push('allowedOperations contains an unsupported operation or is not an array.');
  }
  if (!Array.isArray(policy.deniedOperations) || !policy.deniedOperations.every((item) => OPERATIONS.includes(item))) {
    errors.push('deniedOperations contains an unsupported operation or is not an array.');
  }
  if (!nonEmptyString(policy.userNotice)) errors.push('userNotice is required.');
  if (!nonEmptyString(policy.rationale)) errors.push('rationale is required.');

  if (Array.isArray(policy.allowedOperations) && Array.isArray(policy.deniedOperations)) {
    const overlap = policy.allowedOperations.filter((operation) => policy.deniedOperations.includes(operation));
    if (overlap.length) errors.push(`Operation allow/deny conflict: ${overlap.join(', ')}.`);
    const prohibitedAllowed = policy.allowedOperations.filter((operation) => ALWAYS_DENIED_OPERATIONS.includes(operation));
    if (prohibitedAllowed.length) errors.push(`Always-denied operations cannot be allowed: ${prohibitedAllowed.join(', ')}.`);
  }

  if (Array.isArray(policy.sources)) {
    for (const [index, source] of policy.sources.entries()) {
      if (!isRecord(source)) {
        errors.push(`sources[${index}] must be an object.`);
        continue;
      }
      if (!nonEmptyString(source.url) || !/^https:\/\//i.test(source.url)) errors.push(`sources[${index}].url must be an HTTPS URL.`);
      for (const field of ['title', 'publisher', 'contentFingerprint']) {
        if (!nonEmptyString(source[field])) errors.push(`sources[${index}].${field} is required.`);
      }
      if (!isIsoUtc(source.accessedAt)) errors.push(`sources[${index}].accessedAt must be an ISO-8601 UTC timestamp.`);
      for (const field of ['effectiveFrom', 'effectiveUntil']) {
        if (source[field] !== null && !isIsoUtc(source[field])) errors.push(`sources[${index}].${field} must be an ISO-8601 UTC timestamp or null.`);
      }
      if (typeof source.isPrimary !== 'boolean' || typeof source.isOfficial !== 'boolean') {
        errors.push(`sources[${index}] must explicitly declare isPrimary and isOfficial booleans.`);
      }
      if (source.effectiveFrom && source.effectiveUntil && isIsoUtc(source.effectiveFrom) && isIsoUtc(source.effectiveUntil) &&
          Date.parse(source.effectiveUntil) <= Date.parse(source.effectiveFrom)) {
        errors.push(`sources[${index}] effectiveUntil must be later than effectiveFrom.`);
      }
    }
  }

  if (policy.review !== null && policy.review !== undefined) {
    if (!isRecord(policy.review)) {
      errors.push('review must be an object or null.');
    } else {
      if (!nonEmptyString(policy.review.reviewerId)) errors.push('review.reviewerId is required.');
      if (!isIsoUtc(policy.review.reviewedAt)) errors.push('review.reviewedAt must be an ISO-8601 UTC timestamp.');
      if (!isIsoUtc(policy.review.nextReviewAt)) errors.push('review.nextReviewAt must be an ISO-8601 UTC timestamp.');
      if (!nonEmptyString(policy.review.reviewNotes)) errors.push('review.reviewNotes is required.');
      if (isIsoUtc(policy.review.reviewedAt) && isIsoUtc(policy.review.nextReviewAt) &&
          Date.parse(policy.review.nextReviewAt) <= Date.parse(policy.review.reviewedAt)) {
        errors.push('review.nextReviewAt must be later than review.reviewedAt.');
      }
    }
  }

  if (policy.status === 'verified') {
    if (!Array.isArray(policy.sources) || !policy.sources.some((source) => isRecord(source) && source.isPrimary === true && source.isOfficial === true)) {
      errors.push('A verified policy requires at least one reviewed official primary source.');
    }
    if (!isRecord(policy.review)) errors.push('A verified policy requires a review record.');
    if (!isRecord(policy.constraints)) errors.push('A verified policy requires route-specific output constraints.');
    else if (validRouteKey(policy.route)) validateConstraints(policy.constraints, policy.route.outputChannel, errors);
  }

  return { valid: errors.length === 0, errors };
}

/** Deterministic snapshot token; this is not a cryptographic authenticity proof. */
export function createPolicyFingerprint(policy) {
  const stable = (value) => {
    if (Array.isArray(value)) return value.map(stable);
    if (isRecord(value)) {
      return Object.keys(value).sort().reduce((result, key) => {
        result[key] = stable(value[key]);
        return result;
      }, {});
    }
    return value;
  };
  return JSON.stringify(stable(policy));
}

export function resolveRoute(routeKey, policies) {
  if (!validRouteKey(routeKey)) {
    return { found: false, ambiguous: true, code: DECISION.ROUTE_AMBIGUOUS, policy: null };
  }
  if (!Array.isArray(policies)) {
    return { found: false, ambiguous: false, code: DECISION.ROUTE_NOT_FOUND, policy: null };
  }
  const matches = policies.filter((policy) => isRecord(policy) && routeKeysEqual(policy.route, routeKey));
  if (matches.length === 0) return { found: false, ambiguous: false, code: DECISION.ROUTE_NOT_FOUND, policy: null };
  if (matches.length > 1) return { found: false, ambiguous: true, code: DECISION.ROUTE_AMBIGUOUS, policy: null };
  return { found: true, ambiguous: false, code: null, policy: matches[0] };
}

function decision(code, policy = null, extra = {}) {
  const allowedOperations = Array.isArray(policy?.allowedOperations) ? [...policy.allowedOperations] : [];
  const deniedOperations = Array.isArray(policy?.deniedOperations) ? [...policy.deniedOperations] : [...ALWAYS_DENIED_OPERATIONS];
  return {
    allowed: code === DECISION.ALLOW,
    code,
    routeId: nonEmptyString(policy?.policyId) ? policy.policyId : null,
    policyVersion: Number.isInteger(policy?.policyVersion) ? policy.policyVersion : null,
    policyFingerprint: policy ? createPolicyFingerprint(policy) : null,
    allowedOperations,
    deniedOperations,
    missingFields: [],
    userMessage: code === DECISION.ALLOW
      ? 'Technical policy checks passed. This does not guarantee government acceptance.'
      : 'This route or operation cannot be authorized for official-photo export. Keep the original image unchanged.',
    ...extra
  };
}

/** Evaluate a complete operation plan. All checks are repeated at export time. */
export function evaluatePolicy({ routeKey, policies, operations, now = new Date(), expectedPolicyVersion = null, expectedPolicyFingerprint = null } = {}) {
  if (!validRouteKey(routeKey)) {
    return decision(DECISION.ROUTE_AMBIGUOUS, null, {
      userMessage: 'Select the exact issuing authority, document, application channel, applicant category (if applicable), and output type. No default route was assumed.'
    });
  }

  const resolved = resolveRoute(routeKey, policies);
  if (!resolved.found) return decision(resolved.code);
  const policy = resolved.policy;

  if (policy.status === 'expired') return decision(DECISION.POLICY_EXPIRED, policy);
  if (policy.status !== 'verified') return decision(DECISION.ROUTE_NOT_VERIFIED, policy);

  const hasOfficialPrimarySource = Array.isArray(policy.sources) &&
    policy.sources.some((source) => isRecord(source) && source.isPrimary === true && source.isOfficial === true);
  if (!hasOfficialPrimarySource) return decision(DECISION.POLICY_SOURCE_MISSING, policy);
  if (!isRecord(policy.constraints)) return decision(DECISION.OUTPUT_CONSTRAINTS_INCOMPLETE, policy);

  const schema = validatePolicyRecord(policy);
  if (!schema.valid) return decision(DECISION.POLICY_CONFLICT, policy, { missingFields: schema.errors });

  const nowDate = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(nowDate.getTime())) {
    return decision(DECISION.POLICY_CONFLICT, policy, { missingFields: ['now must be a valid date.'] });
  }
  const nowMs = nowDate.getTime();

  if (Date.parse(policy.review.nextReviewAt) <= nowMs) return decision(DECISION.POLICY_EXPIRED, policy);
  for (const source of policy.sources) {
    if (source.effectiveFrom && Date.parse(source.effectiveFrom) > nowMs) return decision(DECISION.POLICY_NOT_EFFECTIVE, policy);
    if (source.effectiveUntil && Date.parse(source.effectiveUntil) <= nowMs) return decision(DECISION.POLICY_EXPIRED, policy);
  }

  if (!Array.isArray(operations) || operations.length === 0 ||
      !operations.every((operation) => OPERATIONS.includes(operation)) ||
      new Set(operations).size !== operations.length) {
    return decision(DECISION.INVALID_OPERATION_PLAN, policy);
  }

  if (expectedPolicyVersion !== null && expectedPolicyVersion !== policy.policyVersion) {
    return decision(DECISION.POLICY_VERSION_STALE, policy);
  }
  const currentFingerprint = createPolicyFingerprint(policy);
  if (expectedPolicyFingerprint !== null && expectedPolicyFingerprint !== currentFingerprint) {
    return decision(DECISION.POLICY_VERSION_STALE, policy);
  }

  const prohibited = operations.some((operation) => ALWAYS_DENIED_OPERATIONS.includes(operation));
  const notAllowed = operations.some((operation) =>
    prohibited || policy.deniedOperations.includes(operation) || !policy.allowedOperations.includes(operation)
  );
  if (notAllowed) return decision(DECISION.OPERATION_NOT_ALLOWED, policy);

  return decision(DECISION.ALLOW, policy);
}

export function revalidateExport({ routeKey, policies, operations, policyVersion, policyFingerprint, now = new Date() } = {}) {
  return evaluatePolicy({
    routeKey,
    policies,
    operations,
    now,
    expectedPolicyVersion: policyVersion,
    expectedPolicyFingerprint: policyFingerprint
  });
}
