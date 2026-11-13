import test from 'node:test';
import assert from 'node:assert/strict';

import { validateImageUpload, MAX_IMAGE_BYTES, buildImageValidationSummary } from '../src/image-validation.js';
import { getCountryRequirements, isEditedExportAllowed, getUnsupportedRouteStatus } from '../src/document-rules.js';
import { getBackendStatus, assertBackendDisabled } from '../src/backend-disabled-status.js';

test('validateImageUpload accepts supported JPEG uploads within size limit', () => {
  const file = { type: 'image/jpeg', size: 1024 * 100 };
  const result = validateImageUpload(file);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.normalizedType, 'image/jpeg');
});

test('validateImageUpload rejects unsupported file types', () => {
  const file = { type: 'image/gif', size: 1024 };
  const result = validateImageUpload(file);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /Unsupported file format/);
});

test('validateImageUpload rejects oversized files', () => {
  const file = { type: 'image/png', size: MAX_IMAGE_BYTES + 1 };
  const result = validateImageUpload(file);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /too large/i);
});

test('document rules return explicit unsupported state when a route is missing', () => {
  const result = getCountryRequirements('France', 'passport');
  assert.equal(result.supported, false);
  assert.equal(result.status, 'unsupported');
  assert.match(result.reason, /No verified requirements/);

  const unsupported = getUnsupportedRouteStatus('France', 'passport');
  assert.equal(unsupported.supported, false);
});

test('supported country rules are isolated and editing is blocked when official guidance requires unaltered images', () => {
  const result = getCountryRequirements('United States', 'Visa photo');
  assert.equal(result.supported, true);
  assert.equal(result.editingPermitted, false);
  assert.equal(isEditedExportAllowed('United States', 'Visa photo'), false);

  const uk = getCountryRequirements('United Kingdom', 'Passport photo');
  assert.equal(uk.supported, true);
  assert.equal(uk.editingPermitted, false);
});

test('buildImageValidationSummary returns a summary for valid uploads', () => {
  const file = { type: 'image/webp', size: 2048 };
  const summary = buildImageValidationSummary(file);
  assert.equal(summary.ok, true);
  assert.match(summary.summary, /Valid WEBP upload/i);
});

test('backend remains disabled and explicitly fails closed', () => {
  const status = getBackendStatus();
  assert.equal(status.enabled, false);
  assert.equal(status.mode, 'disabled');

  const guard = assertBackendDisabled();
  assert.equal(guard.ok, true);
  assert.equal(guard.mode, 'disabled');
});
