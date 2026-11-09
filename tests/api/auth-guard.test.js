const test = require("node:test");
const assert = require("node:assert/strict");
const { createAuthGuard } = require("../../lib/auth-guard");

const issuer = "https://identity.example";
const audience = "passportai-api";
const now = 1_800_000_000;
const guard = createAuthGuard({ issuer, audience, now: () => now });

function validPrincipal(overrides = {}) {
  return {
    authenticated: true,
    sub: "user-123",
    iss: issuer,
    aud: audience,
    exp: now + 300,
    ...overrides
  };
}

test("fails closed when auth configuration is absent", () => {
  const result = createAuthGuard({}).authorize({ auth: validPrincipal() });
  assert.deepEqual(result, {
    allowed: false,
    statusCode: 503,
    error: "AUTH_NOT_CONFIGURED"
  });
});

test("requires a principal from trusted server middleware", () => {
  assert.equal(guard.authorize({ headers: { "x-user-id": "attacker" } }).error,
    "AUTHENTICATION_REQUIRED");
  assert.equal(guard.authorize({ body: { userId: "attacker" } }).error,
    "AUTHENTICATION_REQUIRED");
});

test("rejects unauthenticated principal", () => {
  const result = guard.authorize({ auth: validPrincipal({ authenticated: false }) });
  assert.equal(result.statusCode, 401);
});

test("accepts a valid verified principal", () => {
  const result = guard.authorize({ auth: validPrincipal() });
  assert.equal(result.allowed, true);
  assert.equal(result.userId, "user-123");
  assert.equal(result.claims.issuer, issuer);
  assert.equal(result.claims.audience, audience);
});

test("accepts audience arrays when the expected audience is present", () => {
  const result = guard.authorize({ auth: validPrincipal({ aud: ["other-api", audience] }) });
  assert.equal(result.allowed, true);
});

test("rejects wrong issuer or audience", () => {
  assert.equal(guard.authorize({ auth: validPrincipal({ iss: "https://evil.example" }) }).error,
    "INVALID_AUTHENTICATED_PRINCIPAL");
  assert.equal(guard.authorize({ auth: validPrincipal({ aud: "other-api" }) }).error,
    "INVALID_AUTHENTICATED_PRINCIPAL");
});

test("rejects expired or missing expiry claims", () => {
  assert.equal(guard.authorize({ auth: validPrincipal({ exp: now }) }).error,
    "INVALID_AUTHENTICATED_PRINCIPAL");
  assert.equal(guard.authorize({ auth: validPrincipal({ exp: undefined }) }).error,
    "INVALID_AUTHENTICATED_PRINCIPAL");
});

test("rejects missing subject", () => {
  assert.equal(guard.authorize({ auth: validPrincipal({ sub: " " }) }).error,
    "INVALID_AUTHENTICATED_PRINCIPAL");
});
