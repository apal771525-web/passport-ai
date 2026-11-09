/**
 * Authorization guard for a trusted authentication middleware.
 *
 * IMPORTANT: this module does not parse or verify JWTs. A vetted auth SDK /
 * middleware must verify signature, issuer, audience, expiry and token claims,
 * then attach the resulting verified principal to req.auth.
 * Never populate req.auth from client-supplied headers or request JSON.
 */
function createAuthGuard({ issuer, audience, now = () => Math.floor(Date.now() / 1000) } = {}) {
  const configured =
    typeof issuer === "string" && issuer.length > 0 &&
    typeof audience === "string" && audience.length > 0;

  function authorize(request) {
    if (!configured) {
      return { allowed: false, statusCode: 503, error: "AUTH_NOT_CONFIGURED" };
    }

    const principal = request && request.auth;
    if (!principal || principal.authenticated !== true) {
      return { allowed: false, statusCode: 401, error: "AUTHENTICATION_REQUIRED" };
    }

    if (
      typeof principal.sub !== "string" || !principal.sub.trim() ||
      principal.iss !== issuer ||
      !(principal.aud === audience ||
        (Array.isArray(principal.aud) && principal.aud.includes(audience))) ||
      !Number.isInteger(principal.exp) ||
      principal.exp <= now()
    ) {
      return { allowed: false, statusCode: 401, error: "INVALID_AUTHENTICATED_PRINCIPAL" };
    }

    return {
      allowed: true,
      userId: principal.sub,
      claims: {
        issuer: principal.iss,
        audience,
        expiresAt: principal.exp
      }
    };
  }

  return { authorize };
}

module.exports = { createAuthGuard };
