const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const SAFE_ID = /^[A-Za-z0-9_-]{16,128}$/;
const SAFE_OBJECT_KEY = /^uploads\/[a-f0-9]{64}\/[A-Za-z0-9_-]{16,128}\/source$/;

function deny(code) {
  return { ok: false, code };
}

/**
 * Authorize a one-time private-object upload using a durable atomic intent store.
 * store.consumeOnce(id) must atomically return and consume an unconsumed intent,
 * or return null. There is intentionally no in-memory fallback.
 */
export async function authorizeUpload({
  store,
  intentId,
  principal,
  contentType,
  contentLength,
  objectKey,
  now = Date.now(),
}) {
  if (!store || typeof store.consumeOnce !== "function") {
    return deny("UPLOAD_STORE_UNAVAILABLE");
  }
  if (!principal || principal.authenticated !== true ||
      typeof principal.subject !== "string" || !principal.subject.trim()) {
    return deny("AUTH_REQUIRED");
  }
  if (typeof intentId !== "string" || !SAFE_ID.test(intentId)) {
    return deny("INVALID_INTENT");
  }
  if (!ALLOWED_TYPES.has(contentType)) return deny("UNSUPPORTED_MEDIA_TYPE");
  if (!Number.isSafeInteger(contentLength) || contentLength < 1 ||
      contentLength > MAX_IMAGE_BYTES) return deny("INVALID_IMAGE_SIZE");

  let intent;
  try {
    intent = await store.consumeOnce(intentId);
  } catch {
    return deny("UPLOAD_STORE_UNAVAILABLE");
  }
  if (!intent) return deny("INTENT_MISSING_OR_CONSUMED");
  if (intent.status !== "issued") return deny("INTENT_NOT_ISSUED");
  if (intent.userId !== principal.subject) return deny("INTENT_OWNER_MISMATCH");
  if (!Number.isFinite(intent.expiresAt) || intent.expiresAt <= now) {
    return deny("INTENT_EXPIRED");
  }
  if (intent.contentType !== contentType) return deny("INTENT_TYPE_MISMATCH");
  if (!Number.isSafeInteger(intent.maxBytes) || intent.maxBytes < 1 ||
      contentLength > Math.min(intent.maxBytes, MAX_IMAGE_BYTES)) {
    return deny("INTENT_SIZE_EXCEEDED");
  }
  if (typeof intent.objectKey !== "string" ||
      !SAFE_OBJECT_KEY.test(intent.objectKey) ||
      objectKey !== intent.objectKey) {
    return deny("OBJECT_KEY_MISMATCH");
  }

  return {
    ok: true,
    objectKey: intent.objectKey,
    contentType,
    contentLength,
    expiresAt: intent.expiresAt,
  };
}

export const uploadPolicyLimits = Object.freeze({
  maxImageBytes: MAX_IMAGE_BYTES,
  allowedTypes: Object.freeze([...ALLOWED_TYPES]),
});
