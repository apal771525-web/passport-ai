import { evaluatePolicy } from './route-policy.js';

const REASON = Object.freeze({
  ALLOW: 'ALLOW',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_POLICY_SET: 'INVALID_POLICY_SET',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  ROUTE_AMBIGUOUS: 'ROUTE_AMBIGUOUS',
  OUTPUT_CONSTRAINTS_MISMATCH: 'OUTPUT_CONSTRAINTS_MISMATCH',
  POLICY_ENGINE_ERROR: 'POLICY_ENGINE_ERROR',
  POLICY_DENIED: 'POLICY_DENIED'
});
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPlainRecord = (value) => {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;
function isPlainJson(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return false;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Date) return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.every((item) => isPlainJson(item, seen));
  if (!isPlainRecord(value)) return false;
  return Object.entries(value).every(([key, item]) =>
    !/(image|base64|file|path|exif|gps|biometric|face|landmark|embedding|element|node|target)/i.test(key) &&
    !/^bytes$/i.test(key) &&
    isPlainJson(item, seen)
  );
}
function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (isRecord(value)) {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}
function denied(reasonCode, policyVersion = null) {
  return { allowed: false, reasonCode, policyVersion: isPositiveInteger(policyVersion) ? policyVersion : null };
}
export function authorizeExport({
  policySet,
  routeId,
  requestedOperations,
  outputConstraints,
  expectedVersion,
  expectedFingerprint,
  now = new Date()
} = {}) {
  try {
    if (!Array.isArray(policySet) || policySet.length === 0 ||
        !policySet.every((policy) => isPlainRecord(policy))) {
      return denied(REASON.INVALID_POLICY_SET);
    }
    if (typeof routeId !== 'string' || routeId.trim() === '' ||
        !Array.isArray(requestedOperations) || requestedOperations.length === 0 ||
        !requestedOperations.every((operation) => typeof operation === 'string' && operation.trim() !== '') ||
        !isPlainRecord(outputConstraints) || !isPlainJson(outputConstraints) ||
        !isPositiveInteger(expectedVersion) ||
        typeof expectedFingerprint !== 'string' || expectedFingerprint.length === 0) {
      return denied(REASON.INVALID_REQUEST);
    }
    const matches = policySet.filter((policy) => policy.policyId === routeId);
    if (matches.length === 0) return denied(REASON.ROUTE_NOT_FOUND);
    if (matches.length !== 1) return denied(REASON.ROUTE_AMBIGUOUS);
    const policy = matches[0];
    if (!isPlainRecord(policy.route) || !isPlainRecord(policy.constraints)) {
      return denied(REASON.INVALID_POLICY_SET, policy.policyVersion);
    }
    if (stableJson(outputConstraints) !== stableJson(policy.constraints)) {
      return denied(REASON.OUTPUT_CONSTRAINTS_MISMATCH, policy.policyVersion);
    }
    const engineDecision = evaluatePolicy({
      routeKey: policy.route,
      policies: policySet,
      operations: requestedOperations,
      now,
      expectedPolicyVersion: expectedVersion,
      expectedPolicyFingerprint: expectedFingerprint
    });
    if (!isPlainRecord(engineDecision) || typeof engineDecision.allowed !== 'boolean' ||
        typeof engineDecision.code !== 'string') {
      return denied(REASON.POLICY_ENGINE_ERROR, policy.policyVersion);
    }
    if (engineDecision.allowed !== true || engineDecision.code !== 'ALLOW') {
      return denied(engineDecision.code || REASON.POLICY_DENIED, policy.policyVersion);
    }
    if (engineDecision.policyVersion !== expectedVersion) {
      return denied(REASON.POLICY_DENIED, policy.policyVersion);
    }
    return { allowed: true, reasonCode: 'ALLOW', policyVersion: engineDecision.policyVersion };
  } catch {
    return denied(REASON.POLICY_ENGINE_ERROR);
  }
}
