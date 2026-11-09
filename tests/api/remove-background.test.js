const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../../api/remove-background");

function invoke({ method = "POST", contentType = "application/json", body = {} } = {}) {
  const headers = {};
  const response = {
    statusCode: 200,
    payload: undefined,
    setHeader(name, value) { headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  const request = { method, headers: { "content-type": contentType }, body };
  return Promise.resolve(handler(request, response)).then(() => ({ response, headers }));
}

const png8 = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString("base64");

test("rejects non-POST requests", async () => {
  const { response, headers } = await invoke({ method: "GET" });
  assert.equal(response.statusCode, 405);
  assert.equal(headers.Allow, "POST");
});

test("rejects non-JSON content types", async () => {
  const { response } = await invoke({ contentType: "text/plain" });
  assert.equal(response.statusCode, 415);
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

test("accepts a valid PNG signature but remains safely disabled", async () => {
  const { response, headers } = await invoke({
    body: { imageBase64: png8, mimeType: "image/png" }
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.error, "PROVIDER_NOT_CONFIGURED");
  assert.match(response.payload.message, /No image was sent to a third party/);
  assert.equal(headers["Cache-Control"], "no-store, max-age=0");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
});
