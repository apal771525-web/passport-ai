const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../../api/remove-background");

function createResponse() {
  const headers = {};
  const response = {
    statusCode: 200,
    payload: undefined,
    setHeader(name, value) { headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  return { response, headers };
}

test("rejects non-POST requests", async () => {
  const { response, headers } = createResponse();
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(headers.Allow, "POST");
});

test("fails closed before reading or processing an image body", async () => {
  const { response, headers } = createResponse();
  let bodyRead = false;
  const request = {
    method: "POST",
    get body() {
      bodyRead = true;
      throw new Error("request body must not be read while backend is disabled");
    }
  };

  await handler(request, response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.error, "BACKEND_DISABLED");
  assert.match(response.payload.message, /No image was processed or uploaded/);
  assert.equal(bodyRead, false);
  assert.equal(headers["Cache-Control"], "no-store, max-age=0");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "no-referrer");
});
