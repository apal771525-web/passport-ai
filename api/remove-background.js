// PassportAI background-removal API remains intentionally disabled.
// No authentication provider, durable rate-limit store, upload-intent store,
// or AI provider is configured. Fail closed before reading or processing input.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (!req || req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // Do not parse request bodies, accept uploads, or reveal provider configuration
  // until verified authentication, durable rate limiting, and private storage
  // are integrated and independently tested.
  return res.status(503).json({
    error: "BACKEND_DISABLED",
    message: "Background removal is not available yet. No image was processed or uploaded."
  });
};

module.exports.config = { api: { bodyParser: false } };
