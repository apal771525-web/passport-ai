import { authorizeExport } from './export-gate.js';

const FORM_FIELDS = new Set([
  'routeId',
  'requestedOperations',
  'outputConstraints',
  'expectedVersion',
  'expectedFingerprint'
]);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPlainRecord = (value) => {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
function isSafeFormData(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return false;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Date) return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.every((item) => isSafeFormData(item, seen));
  if (!isPlainRecord(value)) return false;
  return Object.entries(value).every(([key, item]) =>
    !/(image|base64|file|path|exif|gps|biometric|face|landmark|embedding|element|node|target)/i.test(key) &&
    !/^bytes$/i.test(key) &&
    isSafeFormData(item, seen)
  );
}
function denied(reasonCode) {
  return { allowed: false, reasonCode, policyVersion: null };
}
export function authorizeUiExport({ formState, policySet, now = new Date(), policyEngine } = {}) {
  try {
    if (!isPlainRecord(formState) || !isSafeFormData(formState)) return denied('INVALID_UI_INPUT');
    const fields = Object.keys(formState);
    if (fields.length !== FORM_FIELDS.size || fields.some((field) => !FORM_FIELDS.has(field))) {
      return denied('UNKNOWN_UI_FIELD');
    }
    const request = {
      policySet,
      routeId: formState.routeId,
      requestedOperations: formState.requestedOperations,
      outputConstraints: formState.outputConstraints,
      expectedVersion: formState.expectedVersion,
      expectedFingerprint: formState.expectedFingerprint,
      now
    };
    if (policyEngine !== undefined) request.policyEngine = policyEngine;
    const result = authorizeExport(request);
    if (!isPlainRecord(result) || typeof result.allowed !== 'boolean' ||
        typeof result.reasonCode !== 'string' ||
        !(result.policyVersion === null || (Number.isInteger(result.policyVersion) && result.policyVersion > 0))) {
      return denied('INVALID_GATE_DECISION');
    }
    return {
      allowed: result.allowed === true,
      reasonCode: result.reasonCode,
      policyVersion: result.policyVersion
    };
  } catch {
    return denied('UI_ADAPTER_ERROR');
  }
}
