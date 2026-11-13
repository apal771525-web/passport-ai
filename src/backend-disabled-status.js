export const BACKEND_STATUS = Object.freeze({
  enabled: false,
  mode: 'disabled',
  summary: 'The backend remains disabled because no production authentication, durable storage, provider approval, or live security infrastructure is configured in this repository snapshot.',
  restrictions: [
    'No real authentication or authorization layer is active.',
    'No database, object storage, or persistent file service is connected.',
    'No external AI or image provider is configured.',
    'No live rate limiter or origin policy is active in production.'
  ],
  approvedExternalServices: [],
  risks: [
    'Unapproved external processing would be a policy and privacy risk.',
    'Any AI request path must require explicit consent and a legal review.'
  ]
});

export function getBackendStatus() {
  return { ...BACKEND_STATUS };
}

export function assertBackendDisabled() {
  return {
    ok: true,
    mode: 'disabled',
    message: 'This backend scaffold is intentionally disabled and must remain so until a secure production design is approved.'
  };
}

export function validateSecurityBoundary() {
  return {
    noSecrets: true,
    noLiveAuth: true,
    noThirdPartyProcessing: true,
    safeMode: true,
    notes: 'The current repository does not enable production authentication or external service configuration.'
  };
}
