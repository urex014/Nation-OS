import test from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../lib/nigeria/http.mjs";

const request = (headers) =>
  new Request("http://127.0.0.1:4173/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ message: "Hello" }),
  });
test("browser-facing Host is accepted when Next reconstructs a loopback URL", async () => {
  assert.deepEqual(
    await readJson(request({ host: "localhost:4173", origin: "http://localhost:4173" })),
    { message: "Hello" },
  );
  assert.deepEqual(
    await readJson(request({ host: "127.0.0.1:4173", origin: "http://127.0.0.1:4173" })),
    { message: "Hello" },
  );
});
test("foreign origins and untrusted forwarded headers remain blocked", async () => {
  for (const headers of [
    { host: "localhost:4173", origin: "https://untrusted.example" },
    { host: "localhost:4173", origin: "http://localhost:9999" },
    { host: "localhost:4173", origin: "null" },
    {
      host: "localhost:4173",
      origin: "https://untrusted.example",
      "x-forwarded-host": "untrusted.example",
      "x-forwarded-proto": "https",
    },
  ])
    await assert.rejects(readJson(request(headers)), { status: 403 });
});
test("browser same-origin metadata survives a preview proxy without allowing same-site requests", async () => {
  const headers = {
    host: "127.0.0.1:4173",
    origin: "https://preview.example",
    "sec-fetch-site": "same-origin",
  };
  assert.deepEqual(await readJson(request(headers)), { message: "Hello" });
  for (const site of ["same-site", "cross-site"])
    await assert.rejects(readJson(request({ ...headers, "sec-fetch-site": site })), {
      status: 403,
    });
  await assert.rejects(readJson(request({ ...headers, origin: "null" })), { status: 403 });
});
test("a reverse proxy requires an explicitly configured public origin", async () => {
  const before = process.env.NATIONOS_ALLOWED_ORIGINS;
  try {
    process.env.NATIONOS_ALLOWED_ORIGINS = "https://workspace.example";
    assert.deepEqual(
      await readJson(request({ host: "localhost:4173", origin: "https://workspace.example" })),
      { message: "Hello" },
    );
    await assert.rejects(
      readJson(request({ host: "localhost:4173", origin: "https://other.example" })),
      { status: 403 },
    );
  } finally {
    if (before === undefined) delete process.env.NATIONOS_ALLOWED_ORIGINS;
    else process.env.NATIONOS_ALLOWED_ORIGINS = before;
  }
});
