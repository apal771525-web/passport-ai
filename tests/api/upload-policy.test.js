import test from "node:test";
import assert from "node:assert/strict";
import { authorizeUpload, uploadPolicyLimits } from "../../lib/upload-policy.js";

const validIntent = (overrides = {}) => ({
  status: "issued",
  userId: "user-123",
  expiresAt: 2_000_000,
  contentType: "image/jpeg",
  maxBytes: 3 * 1024 * 1024,
  objectKey: `uploads/${"a".repeat(64)}/intent_123456789012/source`,
  ...overrides,
});
const validArgs = (overrides = {}) => ({
  store: { consumeOnce: async () => validIntent() },
  intentId: "intent_123456789012",
  principal: { authenticated: true, subject: "user-123" },
  contentType: "image/jpeg",
  contentLength: 120_000,
  objectKey: validIntent().objectKey,
  now: 1_000_000,
  ...overrides,
});

test("accepts a valid, owned, unexpired one-time upload intent", async () => {
  const result = await authorizeUpload(validArgs());
  assert.equal(result.ok, true);
  assert.equal(result.objectKey, validIntent().objectKey);
});
test("fails closed without durable store", async () => {
  assert.equal((await authorizeUpload(validArgs({ store: null }))).code, "UPLOAD_STORE_UNAVAILABLE");
});
test("requires authenticated server principal", async () => {
  assert.equal((await authorizeUpload(validArgs({ principal: null }))).code, "AUTH_REQUIRED");
});
test("rejects malformed intent identifiers", async () => {
  assert.equal((await authorizeUpload(validArgs({ intentId: "../bad" }))).code, "INVALID_INTENT");
});
test("rejects missing or consumed intents", async () => {
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => null } }))).code, "INTENT_MISSING_OR_CONSUMED");
});
test("rejects non-issued intents", async () => {
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => validIntent({ status: "consumed" }) } }))).code, "INTENT_NOT_ISSUED");
});
test("rejects another user's intent", async () => {
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => validIntent({ userId: "someone-else" }) } }))).code, "INTENT_OWNER_MISMATCH");
});
test("rejects expired intents", async () => {
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => validIntent({ expiresAt: 999_999 }) } }))).code, "INTENT_EXPIRED");
});
test("rejects unsupported and mismatched media types", async () => {
  assert.equal((await authorizeUpload(validArgs({ contentType: "image/gif" }))).code, "UNSUPPORTED_MEDIA_TYPE");
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => validIntent({ contentType: "image/png" }) } }))).code, "INTENT_TYPE_MISMATCH");
});
test("enforces positive integer and 3 MiB upload ceiling", async () => {
  assert.equal((await authorizeUpload(validArgs({ contentLength: 0 }))).code, "INVALID_IMAGE_SIZE");
  assert.equal((await authorizeUpload(validArgs({ contentLength: uploadPolicyLimits.maxImageBytes + 1 }))).code, "INVALID_IMAGE_SIZE");
});
test("enforces intent-specific size limit", async () => {
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => validIntent({ maxBytes: 100 }) } }))).code, "INTENT_SIZE_EXCEEDED");
});
test("rejects client-supplied or mismatched object paths", async () => {
  assert.equal((await authorizeUpload(validArgs({ objectKey: "https://evil.example/file" }))).code, "OBJECT_KEY_MISMATCH");
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => validIntent({ objectKey: "../../public/file" }) } }))).code, "OBJECT_KEY_MISMATCH");
});
test("fails closed when intent store throws", async () => {
  assert.equal((await authorizeUpload(validArgs({ store: { consumeOnce: async () => { throw new Error("offline"); } } }))).code, "UPLOAD_STORE_UNAVAILABLE");
});
