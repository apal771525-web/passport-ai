// Server-only provider configuration. Never import this file in browser code.
function getProviderStatus() {
  const name = String(process.env.BACKGROUND_PROVIDER || "disabled").toLowerCase();
  if (name === "photoroom") return {
    name, configured: Boolean(process.env.PHOTOROOM_API_KEY),
    enabled: process.env.BACKGROUND_API_ENABLED === "true"
  };
  if (name === "bria") return {
    name, configured: Boolean(process.env.BRIA_API_KEY),
    enabled: process.env.BACKGROUND_API_ENABLED === "true"
  };
  return { name: "disabled", configured: false, enabled: false };
}
module.exports = { getProviderStatus };
