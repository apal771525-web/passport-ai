import test from 'node:test';
import assert from 'node:assert/strict';
import { createPolicyFingerprint } from '../src/route-policy.js';
import { authorizeExport } from '../src/export-gate.js';
import { authorizeUiExport } from '../src/ui-adapter.js';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const ROUTE = Object.freeze({
  jurisdiction: 'US',
  authorityId: 'synthetic-fixture-authority',
  documentType: 'passport-photo',
  applicationChannel: 'online-renewal',
  applicantCategory: 'adult',
  outputChannel: 'digital',
  workflowId: 'renewal-v1'
});
const CONSTRAINTS = Object.freeze({
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
});
function makePolicy(overrides = {}) {
  const base = {
    schemaVersion: '1.0',
    policyId: 'fixture-route-001',
    policyVersion: 7,
    route: { ...ROUTE },
    status: 'verified',
    sources: [{
      url: 'https://example.gov/identity-photo-guidance',
      title: 'Synthetic official guidance fixture',
      publisher: 'Example Government',
      accessedAt: '2026-11-18T10:00:00.000Z',
      effectiveFrom: null,
      effectiveUntil: null,
      contentFingerprint: 'synthetic-fixture-source-v1',
      isPrimary: true,
      isOfficial: true
    }],
    review: {
      reviewerId: 'test-reviewer',
      reviewedAt: '2026-11-18T10:00:00.000Z',
      nextReviewAt: '2027-11-18T10:00:00.000Z',
      reviewNotes: 'Synthetic test fixture; not a real jurisdiction rule.'
    },
    allowedOperations: ['compression', 'crop', 'resize'],
    deniedOperations: ['face_geometry_change', 'synthetic_face_generation'],
    constraints: structuredClone(CONSTRAINTS),
    userNotice: 'Technical checks only; no acceptance guarantee.',
    rationale: 'Synthetic test fixture only.'
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
function request(policy = makePolicy(), overrides = {}) {
  return {
    policySet: [policy],
    routeId: policy.policyId,
    requestedOperations: ['compression', 'crop'],
    outputConstraints: structuredClone(policy.constraints),
    expectedVersion: policy.policyVersion,
    expectedFingerprint: createPolicyFingerprint(policy),
    now: NOW,
    ...overrides
  };
}
function formState(policy = makePolicy(), overrides = {}) {
  return {
    routeId: policy.policyId,
    requestedOperations: ['compression', 'crop'],
    outputConstraints: structuredClone(policy.constraints),
    expectedVersion: policy.policyVersion,
    expectedFingerprint: createPolicyFingerprint(policy),
    ...overrides
  };
}
test('P1-A6-001 allows a verified, unexpired route when all operations are explicitly allowed', () => {
  const result = authorizeExport(request());
  assert.deepEqual(result, { allowed: true, reasonCode: 'ALLOW', policyVersion: 7 });
});
test('P1-A6-002 denies an unknown route id', () => {
  assert.equal(authorizeExport(request(makePolicy(), { routeId: 'unknown-route' })).allowed, false);
  assert.equal(authorizeExport(request(makePolicy(), { routeId: 'unknown-route' })).reasonCode, 'ROUTE_NOT_FOUND');
});
test('P1-A6-003 denies ambiguous duplicate route ids', () => {
  const policy = makePolicy();
  const result = authorizeExport(request(policy, { policySet: [policy, makePolicy()] }));
  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, 'ROUTE_AMBIGUOUS');
});
test('P1-A6-004 denies expired policies', () => {
  const policy = makePolicy({ status: 'expired' });
  assert.equal(authorizeExport(request(policy)).allowed, false);
});
test('P1-A6-005 denies unverified policies', () => {
  const policy = makePolicy({ status: 'needs_review' });
  assert.equal(authorizeExport(request(policy)).allowed, false);
});
test('P1-A6-006 denies a missing operation plan', () => {
  assert.equal(authorizeExport(request(makePolicy(), { requestedOperations: [] })).allowed, false);
});
test('P1-A6-007 denies face reshaping even if a caller asks for it', () => {
  assert.equal(authorizeExport(request(makePolicy(), { requestedOperations: ['face_geometry_change'] })).allowed, false);
});
test('P1-A6-008 denies synthetic face generation', () => {
  assert.equal(authorizeExport(request(makePolicy(), { requestedOperations: ['synthetic_face_generation'] })).allowed, false);
});
test('P1-A6-009 denies missing output constraints', () => {
  assert.equal(authorizeExport(request(makePolicy(), { outputConstraints: undefined })).allowed, false);
});
test('P1-A6-010 denies contradictory policy output constraints', () => {
  const policy = makePolicy({
    constraints: { ...CONSTRAINTS, minWidthPx: 900, maxWidthPx: 800 }
  });
  const result = authorizeExport(request(policy));
  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, 'POLICY_CONFLICT');
});
test('P1-A6-011 denies stale expected policy version', () => {
  const policy = makePolicy();
  assert.equal(authorizeExport(request(policy, { expectedVersion: 6 })).allowed, false);
});
test('P1-A6-012 denies stale expected policy fingerprint', () => {
  assert.equal(authorizeExport(request(makePolicy(), { expectedFingerprint: 'stale-fingerprint' })).allowed, false);
});
test('P1-A6-013 denies null, undefined, and malformed policy sets', () => {
  for (const policySet of [null, undefined, {}, 'not-a-policy-set', []]) {
    assert.equal(authorizeExport(request(makePolicy(), { policySet })).allowed, false);
  }
});
test('P1-A6-014 denies when the policy engine throws while reading a policy record', () => {
  const policy = makePolicy();
  const expectedFingerprint = createPolicyFingerprint(policy);
  const gateRequest = request(policy, { expectedFingerprint });
  Object.defineProperty(policy, 'status', { get() { throw new Error('forced engine failure'); } });
  const result = authorizeExport(gateRequest);
  assert.deepEqual(result, { allowed: false, reasonCode: 'POLICY_ENGINE_ERROR', policyVersion: null });
});
test('P1-A6-015 adapter rejects extra or unknown form fields', () => {
  const policy = makePolicy();
  const state = formState(policy, { authorized: true });
  const result = authorizeUiExport({ formState: state, policySet: [policy], now: NOW });
  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, 'UNKNOWN_UI_FIELD');
});
test('P1-A6-016 adapter rejects DOM-like objects', () => {
  const policy = makePolicy();
  const state = formState(policy);
  state.domNode = { nodeType: 1, nodeName: 'INPUT' };
  assert.equal(authorizeUiExport({ formState: state, policySet: [policy], now: NOW }).allowed, false);
  assert.equal(authorizeUiExport({ formState: Object.create({ routeId: policy.policyId }), policySet: [policy] }).allowed, false);
});
test('P1-A6-017 adapter rejects Buffer and binary data', () => {
  const policy = makePolicy();
  const state = formState(policy);
  state.upload = Buffer.from('not-an-image');
  assert.equal(authorizeUiExport({ formState: state, policySet: [policy], now: NOW }).allowed, false);
});
test('P1-A6-018 adapter output contains no image bytes, file paths, EXIF, GPS or biometric fields', () => {
  const policy = makePolicy();
  const result = authorizeUiExport({ formState: formState(policy), policySet: [policy], now: NOW });
  assert.deepEqual(Object.keys(result).sort(), ['allowed', 'policyVersion', 'reasonCode']);
  for (const forbidden of ['imageBytes', 'bytes', 'filePath', 'path', 'exif', 'gps', 'faceLandmarks', 'biometricData']) {
    assert.equal(Object.hasOwn(result, forbidden), false);
  }
  assert.equal(JSON.stringify(result).includes('not-an-image'), false);
});
test('P1-A6-019 adapter success proves the real policy engine was evaluated', () => {
  const policy = makePolicy();
  let engineReads = 0;
  Object.defineProperty(policy, 'status', { get() { engineReads += 1; return 'verified'; } });
  const result = authorizeUiExport({
    formState: formState(policy),
    policySet: [policy],
    now: NOW
  });
  assert.equal(engineReads > 0, true);
  assert.deepEqual(result, { allowed: true, reasonCode: 'ALLOW', policyVersion: 7 });
});
test('P1-A6-020 adapter denies when the policy engine denies the route', () => {
  const policy = makePolicy({ status: 'needs_review' });
  const result = authorizeUiExport({
    formState: formState(policy),
    policySet: [policy],
    now: NOW
  });
  assert.deepEqual(result, { allowed: false, reasonCode: 'ROUTE_NOT_VERIFIED', policyVersion: 7 });
});
test('P1-A6-021 adapter fails closed when the policy engine throws', () => {
  const policy = makePolicy();
  const state = formState(policy);
  Object.defineProperty(policy, 'status', { get() { throw new Error('forced engine failure'); } });
  const result = authorizeUiExport({
    formState: state,
    policySet: [policy],
    now: NOW
  });
  assert.deepEqual(result, { allowed: false, reasonCode: 'POLICY_ENGINE_ERROR', policyVersion: null });
});
test('P1-A6-022 UI form cannot supply or override the policy engine', () => {
  const policy = makePolicy();
  const state = formState(policy, { policyEngine: () => ({ allowed: true, code: 'ALLOW', policyVersion: 7 }) });
  const result = authorizeUiExport({ formState: state, policySet: [policy], now: NOW });
  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, 'UNKNOWN_UI_FIELD');
});
test('P1-A6-023 denies caller-modified output constraints', () => {
  const policy = makePolicy();
  const modified = { ...policy.constraints, widthPx: 900 };
  const result = authorizeExport(request(policy, { outputConstraints: modified }));
  assert.equal(result.allowed, false);
  assert.equal(result.reasonCode, 'OUTPUT_CONSTRAINTS_MISMATCH');
});
