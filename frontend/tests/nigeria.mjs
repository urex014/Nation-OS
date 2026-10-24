import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
// Isolate every write from the app's working SQLite file.
const temporary = mkdtempSync(path.join(tmpdir(), "nationos-ng-"));
process.env.NATIONOS_DB_PATH = path.join(temporary, "test.sqlite");
const { getDatabase, sourceDirectory } = await import("../lib/nigeria/database.mjs");
const repo = await import("../lib/nigeria/repository.mjs");
const plans = await import("../lib/nigeria/planning.mjs");
const decisions = await import("../lib/nigeria/decisions.mjs");
const { compareScenarios } = await import("../lib/nigeria/scenarios.mjs");
const { importNigeriaData } = await import("../lib/nigeria/import-data.mjs");
const config = {
  scope: "NG-LA",
  years: 5,
  startYear: 2027,
  annualBudgetNaira: 1000000000,
  inflation: 0,
  budgetGrowth: 0,
  revenueGrowth: 0,
  delivery: 100,
  maintenance: 0,
  allocations: plans.allocateBudget(1000000000).allocations,
};
test("source import covers every jurisdiction and preserves missing observations", () => {
  const db = getDatabase();
  assert.equal(repo.getJurisdictions().length, 37);
  assert.equal(Object.getPrototypeOf(repo.getJurisdictions()[0]), Object.prototype);
  assert.equal(Object.getPrototypeOf(repo.getRevenueHistory()[0]), Object.prototype);
  assert.equal(db.prepare("select count(*) n from state_revenue").get().n, 259);
  assert.equal(db.prepare("select count(*) n from indicators").get().n, 121);
  assert.ok(db.prepare("select count(*) n from indicators where value is null").get().n > 0);
  assert.equal(repo.getSources().length, 4);
  const revenue = repo.getRevenue(2025);
  assert.equal(revenue.states[0].name, "Lagos");
  assert.equal(revenue.states[0].totalNaira, 1769194412060.4);
  assert.ok(revenue.states.every((s) => s.reconciliationKobo === 0));
  assert.equal(repo.getOverview().map.length, 37);
  assert.equal(repo.getRevenueHistory("NG-FC").length, 7);
  assert.throws(() => repo.getPlanningContext("AD-01"), { status: 400 });
  assert.throws(() => repo.getRevenue(2030), { status: 400 });
});
test("whole-naira allocation conserves totals for every preference", () => {
  for (const strategy of ["balanced", "social", "infrastructure"]) {
    const r = plans.allocateBudget(1000000001, strategy);
    assert.equal(
      Object.values(r.allocations).reduce((a, b) => a + b, 0),
      1000000001,
    );
  }
  assert.throws(() => plans.allocateBudget(100, "constructor"), { status: 400 });
});
test("model preserves nominal sums and responds in the declared direction", () => {
  const context = repo.getPlanningContext(config.scope),
    base = plans.projectPlan(config, context);
  assert.equal(base.totals.nominalNaira, 5000000000);
  assert.equal(base.totals.constantPriceNaira, 5000000000);
  assert.equal(base.totals.deliveryAdjustedCapitalNaira, 5000000000);
  assert.ok(
    plans.projectPlan({ ...config, inflation: 20 }, context).totals.constantPriceNaira <
      base.totals.constantPriceNaira,
  );
  assert.equal(
    plans.projectPlan({ ...config, delivery: 50 }, context).totals.deliveryAdjustedCapitalNaira,
    2500000000,
  );
  assert.equal(plans.projectPlan({ ...config, years: 10 }, context).annual.length, 10);
  assert.equal(compareScenarios(config, context).length, 4);
  assert.throws(() => plans.validatePlan({ ...config, annualBudgetNaira: 2 }), { status: 400 });
  assert.throws(() => plans.validatePlan({ ...config, years: 7 }), { status: 400 });
  assert.throws(() => plans.validatePlan({ ...config, inflation: NaN }), { status: 400 });
});
test("decision snapshots are server-computed, persistent and revision-protected", () => {
  const d = decisions.createDecision({
    title: "Review education funding",
    reason: "Validate costs and procurement first.",
    config,
    result: { totals: "fabricated" },
  });
  assert.equal(d.result.totals.nominalNaira, 5000000000);
  assert.equal(d.audit.length, 1);
  assert.equal(d.sources.length, 4);
  const r = decisions.reviewDecision(d.id, { status: "Reviewed", expectedRevision: 1 });
  assert.equal(r.revision, 2);
  assert.equal(r.audit.length, 2);
  assert.deepEqual(r.result, d.result);
  assert.throws(() => decisions.reviewDecision(d.id, { status: "Rejected", expectedRevision: 1 }), {
    status: 409,
  });
  importNigeriaData(getDatabase(), sourceDirectory());
  assert.equal(decisions.getDecision(d.id).status, "Reviewed");
  assert.equal(decisions.listDecisions().total, 1);
  assert.equal(Object.getPrototypeOf(decisions.listDecisions().records[0]), Object.prototype);
  getDatabase().close();
  globalThis[Symbol.for("nationos.sqlite")].clear();
  assert.equal(decisions.getDecision(d.id).revision, 2);
});
test("HTTP boundary validates size, origin, JSON and model input", async () => {
  const { POST } = await import("../app/api/plans/route.js");
  const send = (body, headers = {}) =>
    POST(
      new Request("http://localhost/api/plans", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    );
  assert.equal((await send({ config })).status, 200);
  assert.equal((await send({ config: { ...config, scope: "unknown" } })).status, 400);
  assert.equal((await send({ config }, { origin: "https://other.example" })).status, 403);
  assert.equal((await send("invalid")).status, 400);
  assert.equal((await send({ padding: "x".repeat(17000) })).status, 413);
  assert.equal((await send({ config }, { "content-type": "text/plain" })).status, 415);
});
test.after(() => {
  for (const db of globalThis[Symbol.for("nationos.sqlite")].values()) db.close();
  globalThis[Symbol.for("nationos.sqlite")].clear();
  rmSync(temporary, { recursive: true, force: true });
});
