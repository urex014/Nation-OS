import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { comparisonData, planningStates, states } from "../lib/knowledge.mjs";
const require = createRequire(import.meta.url),
  engine = require("../lib/domain/comparison-engine.cjs");
const rows = planningStates.map((s, i) => ({ ...s, type: states[i].type, zone: states[i].zone }));
assert.equal(comparisonData.length, 37);
assert.equal(engine.rank(rows, engine.defaults, "overall", false).length, 36);
assert.equal(engine.score("education", 90), 100);
assert.equal(engine.score("transport", 60), 50);
assert.equal(engine.score("food", 40), 50);
assert.equal(engine.score("food", 0), 100);
assert.throws(() =>
  engine.rank(rows, Object.fromEntries(Object.keys(engine.defaults).map((k) => [k, 0]))),
);
assert.throws(() => engine.score("education", NaN));
for (let i = 0; i < comparisonData.length; i++) {
  const row = comparisonData[i];
  assert(row.score >= 0 && row.score <= 100);
  if (i) assert(comparisonData[i - 1].score >= row.score);
  assert(
    Math.abs(Object.values(row.contributions).reduce((a, b) => a + b, 0) - row.overall) < 1e-9,
  );
}
const changed = rows.map((s) => ({ ...s, population: s.population * 5, religion: "Changed" }));
assert.deepEqual(
  engine.rank(rows).map((s) => s.score),
  engine.rank(changed).map((s) => s.score),
);
const first = rows[0],
  ties = engine.rank([first, { ...first, id: "tie", name: "Zeta Test State" }]);
assert.equal(ties[0].rank, 1);
assert.equal(ties[1].rank, 1);
for (const state of rows) {
  const priorities = engine.improvements(rows, state.id);
  assert(priorities.every((p) => p.gap > 0));
  for (const p of priorities)
    if (p.peer)
      assert(engine.score(p.sector, p.peer.baseline) > engine.score(p.sector, p.baseline));
}
const educationWeights = {
  ...engine.defaults,
  education: 5,
  food: 0,
  transport: 0,
  health: 0,
  energy: 0,
  water: 0,
};
assert.deepEqual(
  engine.rank(rows, educationWeights, "transport").map((s) => s.id),
  engine.rank(rows, engine.defaults, "transport").map((s) => s.id),
);
console.log(
  "Passed: all-state comparisons, target scoring, score bounds, tie ranks, territory filtering, population/identity independence, contributions and stronger-peer recommendations.",
);
