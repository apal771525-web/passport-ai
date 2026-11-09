const crypto = require("node:crypto");

/**
 * Creates a rate limiter backed by an injected shared/durable store.
 * The store must implement consume(key, limit, windowSeconds) atomically and
 * return { allowed: boolean, remaining?: number, retryAfterSeconds?: number }.
 *
 * No in-memory fallback is provided: missing configuration or store failures
 * fail closed. The caller must provide a stable authenticated user/session ID
 * where possible; IP addresses should only be used as a documented fallback.
 */
function createRateLimiter({ store, hmacSecret, limit = 10, windowSeconds = 3600 } = {}) {
  const configured = Boolean(
    store &&
    typeof store.consume === "function" &&
    typeof hmacSecret === "string" &&
    hmacSecret.length >= 32 &&
    Number.isInteger(limit) && limit > 0 &&
    Number.isInteger(windowSeconds) && windowSeconds > 0
  );

  function hashIdentifier(identifier) {
    if (typeof identifier !== "string" || !identifier.trim()) return null;
    return crypto.createHmac("sha256", hmacSecret)
      .update(identifier.trim())
      .digest("hex");
  }

  return {
    async check(identifier) {
      if (!configured) {
        return { allowed: false, reason: "RATE_LIMITER_UNAVAILABLE" };
      }

      const digest = hashIdentifier(identifier);
      if (!digest) {
        return { allowed: false, reason: "RATE_LIMIT_IDENTITY_REQUIRED" };
      }

      try {
        const result = await store.consume(
          `passportai:rate:v1:${digest}`,
          limit,
          windowSeconds
        );
        if (!result || typeof result.allowed !== "boolean") {
          return { allowed: false, reason: "RATE_LIMIT_STORE_INVALID_RESPONSE" };
        }
        return {
          allowed: result.allowed,
          remaining: Number.isInteger(result.remaining) ? result.remaining : undefined,
          retryAfterSeconds: Number.isInteger(result.retryAfterSeconds)
            ? result.retryAfterSeconds
            : undefined,
          reason: result.allowed ? undefined : "RATE_LIMIT_EXCEEDED"
        };
      } catch {
        return { allowed: false, reason: "RATE_LIMIT_STORE_ERROR" };
      }
    }
  };
}

module.exports = { createRateLimiter };
