import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

delete process.env.AI_GATEWAY_API_KEY;
delete process.env.VERCEL_OIDC_TOKEN;
delete process.env.XAI_API_KEY;
const directory = mkdtempSync(path.join(tmpdir(), "nationos-main-api-"));
process.env.NATION_DB_PATH = path.join(directory, "ledger.sqlite");
process.env.NATIONOS_DB_PATH = path.join(directory, "nigeria.sqlite");

const { GET: overview } = await import("../app/api/v1/fiscal/overview/route");
const { GET: scenarios } = await import("../app/api/v1/scenarios/route");
const { POST: recommend } = await import("../app/api/v1/budgets/recommend/route");
const { POST: allocate } = await import("../app/api/allocate/route");
const { POST: chat } = await import("../app/api/chat/route.js");

const json = (url: string, body?: unknown) =>
  new Request(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test("main fiscal routes keep their paths, status codes, and sentences", async () => {
  const figures = await overview(json("http://127.0.0.1:4173/api/v1/fiscal/overview"));
  assert.equal(figures.status, 200);
  const payload = await figures.json();
  assert.equal(payload.currency, "NGN");
  assert.equal(payload.fiscalYear, 2026);
  assert.ok(payload.metrics.approvedExpenditure);

  const badYear = await overview(
    json("http://127.0.0.1:4173/api/v1/fiscal/overview?fiscalYear=1.5"),
  );
  assert.equal(badYear.status, 400);
  assert.equal((await badYear.json()).error, "Year must be a whole number.");

  const missing = await overview(
    json("http://127.0.0.1:4173/api/v1/fiscal/overview?fiscalYear=2050"),
  );
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error, "No figures for that query.");

  const question = await recommend(
    json("http://127.0.0.1:4173/api/v1/budgets/recommend", { question: "short" }),
  );
  assert.equal(question.status, 400);
  assert.equal((await question.json()).error, "Question must be 8 to 500 characters.");

  const scenario = await scenarios(json("http://127.0.0.1:4173/api/v1/scenarios?revenueDrop=15"));
  assert.equal(scenario.status, 200);
  const scenarioBody = await scenario.json();
  assert.equal(scenarioBody.drop, 15);
  assert.equal(scenarioBody.horizon, 5);
  assert.equal(typeof scenarioBody.growth, "number");

  const cut = await allocate(
    json("http://127.0.0.1:4173/api/allocate", { revenue_drop_percentage: 15 }),
  );
  assert.equal(cut.status, 200);
  const cutBody = await cut.json();
  assert.equal(cutBody.capitalUntouched, true);
  assert.equal(
    cutBody.simulation_result,
    "No overhead records are loaded, so the cut is ₦0. Capital stays the same.",
  );

  const ledger = await chat(
    json("http://127.0.0.1:4173/api/chat", { query: "How much was spent on education in Ikeja?" }),
  );
  assert.equal(ledger.status, 200);
  assert.equal((await ledger.json()).answer, "No spending records are loaded.");

  const tiny = await chat(json("http://127.0.0.1:4173/api/chat", { query: "Hi" }));
  assert.equal(tiny.status, 400);
  assert.equal((await tiny.json()).error, "Query must be 3 to 500 characters.");
});

test.after(() => {
  rmSync(directory, { recursive: true, force: true });
});
