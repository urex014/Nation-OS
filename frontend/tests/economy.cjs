const assert = require("node:assert/strict"),
  { baseline: e, resources, fiscalPlan } = require("../lib/domain/economy-engine.cjs");
assert.equal(
  e.allocations.reduce((n, r) => n + r[1], 0),
  e.spending,
);
assert.equal(
  e.revenueSources.reduce((n, r) => n + r[1], 0),
  e.revenue,
);
assert.equal(
  resources.reduce((n, r) => n + r.revenue, 0),
  54000,
);
assert.equal(e.spending - e.revenue, 45000);
assert.equal(e.debt / e.gdp, 0.45);
const fit = fiscalPlan(940, 5),
  over = fiscalPlan(4000, 5),
  zero = fiscalPlan(0, 5);
assert.equal(fit.supplemental, 0);
assert.equal(fit.remaining, 2060);
assert.equal(over.supplemental, 1000);
assert.equal(over.rows[1].extraDebt, 1000);
assert(over.rows.at(-1).extraDebt > 5000);
for (let i = 0; i < fit.rows.length; i++) {
  assert.equal(fit.rows[i].debt, zero.rows[i].debt);
  const row = over.rows[i];
  assert.equal(row.spending - row.revenue, row.deficit);
  if (i) assert(Math.abs(row.debt - over.rows[i - 1].debt - row.deficit) < 1e-6);
}
assert.equal(fiscalPlan(100, 10).rows.at(-1).year, 2036);
assert.throws(() => fiscalPlan(-1, 5));
assert.throws(() => fiscalPlan(100, 7));
console.log(
  "Passed: balanced economic accounts, resource revenue reconciliation, deficit/debt ratios, planning envelope, incremental borrowing, debt stock flows and 10-year fiscal horizon.",
);

const accounts = require("../lib/domain/economy-engine.cjs").stateAccounts(
  require("../data/citizen-states.cjs"),
);
const sum = (k) => accounts.states.reduce((a, s) => a + s[k], 0),
  close = (a, b) => assert(Math.abs(a - b) < 1e-6);
for (const key of ["gdp", "exports", "imports"]) close(sum(key), e[key]);
for (const key of ["revenue", "spending", "debt", "planningEnvelope"])
  close(sum(key) + accounts.federal[key], e[key]);
close(accounts.states.reduce((a, s) => a + s.realGrowth * s.gdp, 0) / e.gdp, e.realGrowth);
close(
  accounts.states.reduce((a, s) => a + s.inflation * s.population, 0) / e.population,
  e.inflation,
);
assert(new Set(accounts.states.map((s) => s.gdp.toFixed(4))).size > 30);
assert(new Set(accounts.states.map((s) => s.revenue.toFixed(4))).size > 30);
assert(new Set(accounts.states.map((s) => s.realGrowth.toFixed(4))).size > 5);
console.log(
  "Passed: distinct state economic accounts, national GDP/trade sums, federal/state budget reconciliation and weighted macro indicators.",
);
