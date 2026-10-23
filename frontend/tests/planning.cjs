const assert = require("node:assert/strict"),
  engine = require("../lib/domain/planning-engine.cjs"),
  register = require("../data/citizen-states.cjs");
const states = register.map((s) => ({
  id: s.id,
  name: s.name,
  population: s.citizenCount,
  baselines: {
    food: s.food,
    education: s.education * 100,
    transport: s.transport,
    health: s.health * 100,
    energy: s.energy * 100,
    water: s.water * 100,
  },
}));
const config = {
  years: 5,
  scope: "all",
  growth: 2,
  delivery: 80,
  maintenance: 20,
  budgets: Object.fromEntries(Object.keys(engine.definitions).map((k) => [k, 100])),
};
const result = engine.project(states, config);
assert.equal(result.years.length, 6);
assert.equal(result.years.at(-1).year, 2031);
assert.equal(result.totalCost, 3000);
assert.equal(result.years[0].population, 24600000);
const ten = engine.project(states, { ...config, years: 10 });
assert.equal(ten.years.at(-1).year, 2036);
assert.equal(ten.totalCost, 6000);
for (const key of Object.keys(engine.definitions)) {
  const r = result.years.at(-1).national[key];
  assert(engine.definitions[key].higher ? r.with >= r.no : r.with <= r.no);
  assert(engine.definitions[key].higher ? r.high >= r.low : r.high <= r.low);
}
for (const variation of [
  { delivery: 0 },
  { budgets: Object.fromEntries(Object.keys(engine.definitions).map((k) => [k, 0])) },
]) {
  const r = engine.project(states, { ...config, ...variation });
  for (const year of r.years)
    for (const key of Object.keys(engine.definitions))
      assert.equal(year.national[key].with, year.national[key].no);
}
const targeted = engine.project(states, { ...config, scope: states[0].id });
const outside = targeted.years.at(-1).states[1];
assert.deepEqual(outside.with, outside.no);
assert.throws(() => engine.project(states, { ...config, years: 7 }));
assert.throws(() => engine.project(states, { ...config, scope: "bad" }));
assert.throws(() =>
  engine.project(states, { ...config, budgets: { ...config.budgets, food: -1 } }),
);
const recs = engine.recommend(states);
assert.equal(recs.length, 6);
assert(recs.every((r, i) => i === 0 || recs[i - 1].score >= r.score));
assert.deepEqual(
  engine.recommend(states),
  engine.recommend(states.map((s) => ({ ...s, religion: "Changed attribute" }))),
);
assert.equal(config.years, 5);
assert.equal(result.config.years, 5);
assert(ten.years.at(-1).population > result.years.at(-1).population);
console.log(
  "Passed: 5/10-year horizons, annual/cumulative costs, effect directions, sensitivity ordering, zero-delivery and zero-budget paths, state scope, validation and religion-independent scoring.",
);
