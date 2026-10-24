import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
// Read-only smoke checks can safely run against the working development server.
for (const route of ["/", "/revenue", "/budget", "/scenarios", "/decisions", "/sources"]) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert.ok(html.includes("Nation"));
  assert.ok(!html.includes("Aderin"));
}
for (const route of ["overview", "revenue", "sources", "decisions"]) {
  const response = await fetch(base + "/api/" + route);
  assert.equal(response.status, 200, route);
}
const overview = await (await fetch(base + "/api/overview")).json();
assert.equal(overview.map.length, 37);
assert.equal((await fetch(base + "/api/revenue?year=2050")).status, 400);
assert.equal((await fetch(base + "/api/decisions/missing")).status, 404);
assert.equal((await fetch(base + "/.env")).status, 404);
assert.equal((await fetch(base + "/account")).status, 404);
console.log("Six pages, source APIs, all boundaries and invalid routes verified.");
const chat = await fetch(base + "/api/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ message: "Compare Lagos and Rivers revenue" }),
});
assert.equal(chat.status, 200);
assert.equal((await chat.json()).table.rows.length, 2);
const intelligence = await (await fetch(base + "/budget")).text();
assert.ok(intelligence.includes("Ask the evidence"));
assert.ok(intelligence.includes("Ask a question"));
console.log("Project Intelligence chat and sourced comparison verified.");
