const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../../api/remove-background");

function invoke({ method = "POST", contentType = "application/json", body = {}, extraHeaders = {} } = {}) {
  const headers = {};
  const response = {
    statusCode: 200,
    payload: undefined,
    setHeader(name, value) { headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  const request = {
    method,
    headers: { "content-type": contentType, host: "passport-ai.example", ...extraHeaders },
    body
  };
  return Promise.resolve(handler(request, response)).then(() => ({ response, headers }));
}

const png8 = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString("base64");

test("rejects non-POST requests", async () => {
  const { response, headers } = await invoke({ method: "GET" });
  assert.equal(response.statusCode, 405);
  assert.equal(headers.Allow, "POST");
});

test("blocks cross-origin browser requests", async () => {
  const { response } = await invoke({ extraHeaders: { origin: "https://attacker.example" } });
  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.error, "CROSS_ORIGIN_REQUEST_BLOCKED");
});

test("rejects malformed Origin headers", async () => {
  const { response } = await invoke({ extraHeaders: { origin: "not-a-url" } });
  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.error, "INVALID_ORIGIN");
});

test("rejects oversized HTTP request bodies before image parsing", async () => {
  const { response } = await invoke({ extraHeaders: { "content-length": String(4 * 1024 * 1024 + 1) } });
  assert.equal(response.statusCode, 413);
  assert.equal(response.payload.error, "REQUEST_TOO_LARGE");
});

test("rejects non-JSON content types", async () => {
  const { response } = await invoke({ contentType: "text/plain" });
  assert.equal(response.statusCode, 415);
});

test("rejects non-object request bodies", async () => {
  const { response } = await invoke({ body: "not-an-object" });
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, "INVALID_REQUEST_BODY");
});

test("rejects missing or unsupported image input", async () => {
  const { response } = await invoke({ body: { imageBase64: "abc", mimeType: "image/gif" } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, "INVALID_IMAGE_INPUT");
});

test("rejects malformed base64", async () => {
  const { response } = await invoke({ body: { imageBase64: "%%%=", mimeType: "image/png" } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, "INVALID_BASE64");
});

test("rejects image signature that does not match declared MIME type", async () => {
  const { response } = await invoke({ body: { imageBase64: png8, mimeType: "image/jpeg" } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.error, "IMAGE_SIGNATURE_MISMATCH");
});

test("rejects images larger than the 3 MiB limit", async () => {
  const oversized = Buffer.alloc(3 * 1024 * 1024 + 1).toString("base64");
  const { response } = await invoke({ body: { imageBase64: oversized, mimeType: "image/png" } });
  assert.equal(response.statusCode, 413);
  assert.equal(response.payload.error, "IMAGE_TOO_LARGE");
});

test("accepts a PNG signature but remains safely disabled", async () => {
  const { response, headers } = await invoke({
    body: { imageBase64: png8, mimeType: "image/png" }
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.error, "PROVIDER_NOT_CONFIGURED");
  assert.match(response.payload.message, /No image was sent to a third party/);
  assert.equal(headers["Cache-Control"], "no-store, max-age=0");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "no-referrer");
});
