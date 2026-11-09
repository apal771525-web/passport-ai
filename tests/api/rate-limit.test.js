const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("../../lib/rate-limit");

const secret = "test-only-secret-with-at-least-32-characters";

test("fails closed when durable store or secret is not configured", async () => {
  const limiter = createRateLimiter({});
  assert.deepEqual(await limiter.check("user-123"), {
    allowed: false,
    reason: "RATE_LIMITER_UNAVAILABLE"
  });
});

test("fails closed when identity is missing", async () => {
  const limiter = createRateLimiter({
    hmacSecret: secret,
    store: { async consume() { throw new Error("must not be called"); } }
  });
  assert.equal((await limiter.check("")).reason, "RATE_LIMIT_IDENTITY_REQUIRED");
});

test("passes atomic shared-store decision and returns quota metadata", async () => {
  let received;
  const limiter = createRateLimiter({
    hmacSecret: secret,
    limit: 5,
    windowSeconds: 60,
    store: {
      async consume(...args) {
        received = args;
        return { allowed: true, remaining: 4 };
      }
    }
  });

  const result = await limiter.check("account-42");
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 4);
  assert.equal(received[1], 5);
  assert.equal(received[2], 60);
  assert.match(received[0], /^passportai:rate:v1:[a-f0-9]{64}$/);
  assert.equal(received[0].includes("account-42"), false);
});

test("returns a rate-limit decision from the durable store", async () => {
  const limiter = createRateLimiter({
    hmacSecret: secret,
    store: {
      async consume() {
        return { allowed: false, remaining: 0, retryAfterSeconds: 30 };
      }
    }
  });
  assert.deepEqual(await limiter.check("account-42"), {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: 30,
    reason: "RATE_LIMIT_EXCEEDED"
  });
});

test("fails closed when the durable store throws", async () => {
  const limiter = createRateLimiter({
    hmacSecret: secret,
    store: { async consume() { throw new Error("store offline"); } }
  });
  assert.deepEqual(await limiter.check("account-42"), {
    allowed: false,
    reason: "RATE_LIMIT_STORE_ERROR"
  });
});

test("does not accept a weak HMAC secret", async () => {
  const limiter = createRateLimiter({
    hmacSecret: "short",
    store: { async consume() { return { allowed: true }; } }
  });
  assert.equal((await limiter.check("account-42")).reason, "RATE_LIMITER_UNAVAILABLE");
});
