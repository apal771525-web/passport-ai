import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALWAYS_DENIED_OPERATIONS,
  createPolicyFingerprint,
  evaluatePolicy,
  revalidateExport,
  resolveRoute,
  validatePolicyRecord
} from '../src/route-policy.js';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const ROUTE = Object.freeze({
  jurisdiction: 'US',
  authorityId: 'state-department',
  documentType: 'passport-photo',
  applicationChannel: 'online-renewal',
  applicantCategory: 'adult',
  outputChannel: 'digital',
  workflowId: 'renewal-v1'
});

function makePolicy(overrides = {}) {
  const base = {
    schemaVersion: '1.0',
    policyId: 'test-us-passport-adult-digital',
    policyVersion: 3,
    route: { ...ROUTE },
    status: 'verified',
    sources: [{
      url: 'https://example.gov/photo-guidance',
      title: 'Official photo guidance fixture',
      publisher: 'Example Government',
      accessedAt: '2026-11-18T10:00:00.000Z',
      effectiveFrom: null,
      effectiveUntil: null,
      contentFingerprint: 'source-fixture-v1',
      isPrimary: true,
      isOfficial: true
    }],
    review: {
      reviewerId: 'reviewer-fixture',
      reviewedAt: '2026-11-18T10:00:00.000Z',
      nextReviewAt: '2027-11-18T10:00:00.000Z',
      reviewNotes: 'Synthetic fixture for automated tests only.'
    },
    allowedOperations: ['compression'],
    deniedOperations: [...ALWAYS_DENIED_OPERATIONS],
    constraints: {
      widthPx: 600,
      heightPx: 600,
      minWidthPx: null,
      maxWidthPx: null,
      minHeightPx: null,
      maxHeightPx: null,
      aspectRatio: 1,
      allowedFormats: ['image/jpeg'],
      maxBytes: 240000,
      minBytes: null,
      printWidthMm: null,
      printHeightMm: null,
      dpi: null
    },
    userNotice: 'Technical checks only; acceptance is determined by the authority.',
    rationale: 'Synthetic policy fixture; not a real country rule.'
  };
  return {
    ...base,
    ...overrides,
    route: overrides.route ? { ...base.route, ...overrides.route } : base.route,
    sources: overrides.sources ?? base.sources,
    review: overrides.review === undefined ? base.review : overrides.review,
    constraints: overrides.constraints === undefined ? base.constraints : overrides.constraints,
    allowedOperations: overrides.allowedOperations ?? base.allowedOperations,
    deniedOperations: overrides.deniedOperations ?? base.deniedOperations
  };
}

const validPolicy = makePolicy();
const allowed = (policy = validPolicy, options = {}) => evaluatePolicy({
  routeKey: ROUTE,
  policies: [policy],
  operations: ['compression'],
  now: NOW,
  ...options
});

// RP-001 to RP-008: route resolution and status handling.
test('RP-001 exact complete route tuple resolves to one policy', () => {
  const result = resolveRoute(ROUTE, [validPolicy]);
  assert.equal(result.found, true);
  assert.equal(result.policy.policyId, validPolicy.policyId);
});
test('RP-002 no matching route returns ROUTE_NOT_FOUND', () => {
  assert.equal(evaluatePolicy({ routeKey: { ...ROUTE, jurisdiction: 'GB' }, policies: [validPolicy], operations: ['compression'], now: NOW }).code, 'ROUTE_NOT_FOUND');
});
test('RP-003 duplicate exact route records return ROUTE_AMBIGUOUS', () => {
  assert.equal(evaluatePolicy({ routeKey: ROUTE, policies: [validPolicy, makePolicy({ policyId: 'duplicate' })], operations: ['compression'], now: NOW }).code, 'ROUTE_AMBIGUOUS');
});
test('RP-004 missing authority or channel never falls back to a generic route', () => {
  for (const routeKey of [{ ...ROUTE, authorityId: '' }, { ...ROUTE, applicationChannel: '' }]) {
    assert.equal(evaluatePolicy({ routeKey, policies: [validPolicy], operations: ['compression'], now: NOW }).code, 'ROUTE_AMBIGUOUS');
  }
});
test('RP-005 every non-verified route status blocks official export', () => {
  for (const status of ['needs_review', 'unsupported', 'retired']) assert.equal(allowed(makePolicy({ status })).code, 'ROUTE_NOT_VERIFIED');
  assert.equal(allowed(makePolicy({ status: 'expired' })).code, 'POLICY_EXPIRED');
});
test('RP-006 overdue review blocks export', () => {
  const policy = makePolicy({ review: { ...validPolicy.review, nextReviewAt: '2026-11-19T11:59:59.000Z' } });
  assert.equal(allowed(policy).code, 'POLICY_EXPIRED');
});
test('RP-007 future source effective date blocks use', () => {
  const policy = makePolicy({ sources: [{ ...validPolicy.sources[0], effectiveFrom: '2026-12-01T00:00:00.000Z' }] });
  assert.equal(allowed(policy).code, 'POLICY_NOT_EFFECTIVE');
});
test('RP-008 incomplete route tuple is rejected before policy lookup', () => {
  assert.equal(evaluatePolicy({ routeKey: { ...ROUTE, applicantCategory: undefined }, policies: [validPolicy], operations: ['compression'], now: NOW }).code, 'ROUTE_AMBIGUOUS');
});

// RP-009 to RP-017: schema and operation authorization.
test('RP-009 a synthetic verified fixture passes schema validation', () => {
  assert.deepEqual(validatePolicyRecord(validPolicy), { valid: true, errors: [] });
});
test('RP-010 each explicitly allowed safe operation is accepted', () => {
  for (const operation of ['crop', 'rotate', 'resize', 'background_replace', 'colour_adjust', 'exposure_adjust', 'compression', 'metadata_strip', 'print_layout']) {
    const policy = makePolicy({ allowedOperations: [operation] });
    assert.equal(allowed(policy, { operations: [operation] }).code, 'ALLOW', operation);
  }
});
test('RP-011 each explicitly denied operation is rejected', () => {
  const policy = makePolicy({ allowedOperations: ['compression'], deniedOperations: ['crop', ...ALWAYS_DENIED_OPERATIONS] });
  assert.equal(allowed(policy, { operations: ['crop'] }).code, 'OPERATION_NOT_ALLOWED');
});
test('RP-012 an operation absent from both lists is rejected', () => {
  assert.equal(allowed(validPolicy, { operations: ['resize'] }).code, 'OPERATION_NOT_ALLOWED');
});
test('RP-013 overlapping allow and deny lists invalidate the policy', () => {
  const policy = makePolicy({ allowedOperations: ['compression'], deniedOperations: ['compression', ...ALWAYS_DENIED_OPERATIONS] });
  assert.equal(allowed(policy).code, 'POLICY_CONFLICT');
});
test('RP-014 face geometry and synthetic face operations are always rejected', () => {
  for (const operation of ALWAYS_DENIED_OPERATIONS) {
    const policy = makePolicy({ deniedOperations: [...ALWAYS_DENIED_OPERATIONS, operation] });
    assert.equal(allowed(policy, { operations: [operation] }).code, 'OPERATION_NOT_ALLOWED');
    const invalid = makePolicy({ allowedOperations: ['compression', operation] });
    assert.equal(allowed(invalid).code, 'POLICY_CONFLICT');
  }
});
test('RP-015 authorization depends on policy data, not a UI visibility flag', () => {
  const withUiFlag = { ...validPolicy, uiVisible: false };
  assert.equal(allowed(withUiFlag).code, 'ALLOW');
});
test('RP-016 a multi-operation plan fails if any operation is denied', () => {
  assert.equal(allowed(validPolicy, { operations: ['compression', 'crop'] }).code, 'OPERATION_NOT_ALLOWED');
});
test('RP-017 unknown operation values invalidate the operation plan', () => {
  assert.equal(allowed(validPolicy, { operations: ['beautify'] }).code, 'INVALID_OPERATION_PLAN');
});

// RP-018 to RP-027: constraints, versioning and source integrity.
test('RP-018 missing output constraints return the dedicated incomplete-constraints code', () => {
  assert.equal(allowed(makePolicy({ constraints: null })).code, 'OUTPUT_CONSTRAINTS_INCOMPLETE');
});
test('RP-019 contradictory min/max dimensions invalidate constraints', () => {
  const policy = makePolicy({ constraints: { ...validPolicy.constraints, minWidthPx: 900, maxWidthPx: 800 } });
  assert.equal(validatePolicyRecord(policy).valid, false);
});
test('RP-020 no constraints are inherited from another route', () => {
  const other = makePolicy({ route: { jurisdiction: 'CA' }, policyId: 'other-route' });
  assert.equal(evaluatePolicy({ routeKey: ROUTE, policies: [other], operations: ['compression'], now: NOW }).code, 'ROUTE_NOT_FOUND');
});
test('RP-021 changed policy version invalidates an existing plan', () => {
  assert.equal(allowed(makePolicy({ policyVersion: 4 }), { expectedPolicyVersion: 3 }).code, 'POLICY_VERSION_STALE');
});
test('RP-022 changed source fingerprint invalidates an existing plan snapshot', () => {
  const before = createPolicyFingerprint(validPolicy);
  const changed = makePolicy({ sources: [{ ...validPolicy.sources[0], contentFingerprint: 'changed-source' }] });
  assert.equal(allowed(changed, { expectedPolicyFingerprint: before }).code, 'POLICY_VERSION_STALE');
});
test('RP-023 export revalidation checks the current policy again', () => {
  const fingerprint = createPolicyFingerprint(validPolicy);
  assert.equal(revalidateExport({ routeKey: ROUTE, policies: [validPolicy], operations: ['compression'], policyVersion: 3, policyFingerprint: fingerprint, now: NOW }).code, 'ALLOW');
  assert.equal(revalidateExport({ routeKey: ROUTE, policies: [makePolicy({ status: 'needs_review' })], operations: ['compression'], policyVersion: 3, policyFingerprint: fingerprint, now: NOW }).code, 'ROUTE_NOT_VERIFIED');
});
test('RP-024 a missing official primary source returns POLICY_SOURCE_MISSING', () => {
  const policy = makePolicy({ sources: [{ ...validPolicy.sources[0], isPrimary: false }] });
  assert.equal(allowed(policy).code, 'POLICY_SOURCE_MISSING');
});
test('RP-025 source expiry blocks policy use', () => {
  const policy = makePolicy({ sources: [{ ...validPolicy.sources[0], effectiveUntil: '2026-11-19T11:00:00.000Z' }] });
  assert.equal(allowed(policy).code, 'POLICY_EXPIRED');
});
test('RP-026 invalid source URL or missing fingerprint invalidates policy', () => {
  const policy = makePolicy({ sources: [{ ...validPolicy.sources[0], url: 'http://example.gov', contentFingerprint: '' }] });
  assert.equal(allowed(policy).code, 'POLICY_CONFLICT');
});
test('RP-027 malformed review timestamps invalidate verified policy', () => {
  const policy = makePolicy({ review: { ...validPolicy.review, nextReviewAt: 'not-a-date' } });
  assert.equal(allowed(policy).code, 'POLICY_CONFLICT');
});

// RP-028 to RP-036: privacy and deterministic behavior.
test('RP-028 policy decisions do not contain image bytes or base64 payloads', () => {
  const result = allowed();
  assert.equal(Object.hasOwn(result, 'imageBytes'), false);
  assert.equal(Object.hasOwn(result, 'base64'), false);
  assert.equal(JSON.stringify(result).includes('data:image'), false);
});
test('RP-029 decision object contains no filename, EXIF, GPS or biometric fields', () => {
  const result = allowed();
  for (const field of ['fileName', 'exif', 'gps', 'faceLandmarks', 'embedding']) assert.equal(Object.hasOwn(result, field), false);
});
test('RP-030 evaluating a policy does not mutate the source policy object', () => {
  const before = JSON.stringify(validPolicy);
  allowed(validPolicy);
  assert.equal(JSON.stringify(validPolicy), before);
});
test('RP-031 a rejected plan does not mutate the policy object', () => {
  const policy = makePolicy();
  const before = JSON.stringify(policy);
  allowed(policy, { operations: ['retouch'] });
  assert.equal(JSON.stringify(policy), before);
});
test('RP-032 policy fingerprint is stable across object key order', () => {
  const reordered = Object.fromEntries(Object.entries(validPolicy).reverse());
  assert.equal(createPolicyFingerprint(validPolicy), createPolicyFingerprint(reordered));
});
test('RP-033 a changed policy rationale changes its snapshot fingerprint', () => {
  assert.notEqual(createPolicyFingerprint(validPolicy), createPolicyFingerprint(makePolicy({ rationale: 'Changed rationale.' })));
});
test('RP-034 invalid evaluation clock fails closed', () => {
  assert.equal(allowed(validPolicy, { now: 'not-a-date' }).code, 'POLICY_CONFLICT');
});
test('RP-035 duplicate operations are rejected as an invalid plan', () => {
  assert.equal(allowed(validPolicy, { operations: ['compression', 'compression'] }).code, 'INVALID_OPERATION_PLAN');
});
test('RP-036 empty operation plan is rejected', () => {
  assert.equal(allowed(validPolicy, { operations: [] }).code, 'INVALID_OPERATION_PLAN');
});

// RP-037 to RP-043: product-facing safety and exact route identity.
test('RP-037 capture guidance status is not inferred from edit authorization', () => {
  const result = allowed(makePolicy({ status: 'needs_review' }));
  assert.equal(result.code, 'ROUTE_NOT_VERIFIED');
  assert.equal(result.allowed, false);
});
test('RP-038 successful decision uses technical-check language, not approval claims', () => {
  const result = allowed();
  assert.equal(result.code, 'ALLOW');
  assert.match(result.userMessage, /Technical policy checks passed/);
  assert.doesNotMatch(result.userMessage, /government approved|guaranteed compliant/i);
});
test('RP-039 blocked export tells the user to preserve the original', () => {
  assert.match(allowed(validPolicy, { operations: ['retouch'] }).userMessage, /original image unchanged/i);
});
test('RP-040 route identity matching is exact after safe case/whitespace normalization', () => {
  const key = { ...ROUTE, jurisdiction: 'us', authorityId: ' STATE-DEPARTMENT ', documentType: 'PASSPORT-PHOTO' };
  assert.equal(resolveRoute(key, [validPolicy]).found, true);
});
test('RP-041 different applicant categories do not collide', () => {
  assert.equal(resolveRoute({ ...ROUTE, applicantCategory: 'child' }, [validPolicy]).found, false);
});
test('RP-042 digital and printed output routes do not collide', () => {
  assert.equal(resolveRoute({ ...ROUTE, outputChannel: 'printed' }, [validPolicy]).found, false);
});
test('RP-043 workflow variants do not inherit each other policy', () => {
  assert.equal(resolveRoute({ ...ROUTE, workflowId: 'first-application-v1' }, [validPolicy]).found, false);
});
