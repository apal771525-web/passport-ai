// PassportAI secure background-removal API scaffold.
// Deliberately disabled: this endpoint never calls an AI provider in this version.
const { getProviderStatus } = require("../lib/provider-config");
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  if (!String(req.headers["content-type"] || "").toLowerCase().includes("application/json")) {
    return res.status(415).json({ error: "UNSUPPORTED_CONTENT_TYPE" });
  }

  const { imageBase64, mimeType } = req.body || {};
  if (!ALLOWED.has(mimeType) || typeof imageBase64 !== "string") {
    return res.status(400).json({ error: "INVALID_IMAGE_INPUT" });
  }
  const match = imageBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  const encoded = match ? match[2] : imageBase64;
  if (match && match[1] !== mimeType) return res.status(400).json({ error: "MIME_TYPE_MISMATCH" });
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
    return res.status(400).json({ error: "INVALID_BASE64" });
  }

  const estimated = Math.floor(encoded.length * 3 / 4) -
    (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
  if (estimated <= 0 || estimated > MAX_IMAGE_BYTES) {
    return res.status(413).json({ error: "IMAGE_TOO_LARGE", maxBytes: MAX_IMAGE_BYTES });
  }
  const buffer = Buffer.from(encoded, "base64");
  const valid = {
    "image/jpeg": buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255,
    "image/png": buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    "image/webp": buffer.length >= 12 && buffer.toString("ascii",0,4) === "RIFF" && buffer.toString("ascii",8,12) === "WEBP"
  };
  if (!valid[mimeType]) return res.status(400).json({ error: "IMAGE_SIGNATURE_MISMATCH" });

  // No disk writes, provider requests, or image logging in this scaffold.
  buffer.fill(0);
  const provider = getProviderStatus();
  return res.status(503).json({
    error: "PROVIDER_NOT_CONFIGURED",
    message: "No AI provider is connected. No image was sent to a third party.",
    provider: provider.name,
    configured: provider.configured
  });
};

module.exports.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
