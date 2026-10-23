const assert = require("node:assert/strict"),
  engine = require("../lib/domain/citizen-engine.cjs"),
  raw = require("../data/citizen-states.cjs"),
  states = engine.prepare(raw);
assert.equal(states.length, 37);
assert.equal(
  states.reduce((n, s) => n + s.count, 0),
  24600000,
);
assert.deepEqual(engine.citizen(0, states), engine.citizen(0, states));
assert.equal(engine.citizen(24599999, states).id, "AD-C-24600000");
assert.throws(() => engine.citizen(-1, states), RangeError);
assert.throws(() => engine.citizen(24600000, states), RangeError);
for (const s of states) {
  const first = engine.citizen(s.offset, states),
    last = engine.citizen(s.offset + s.count - 1, states);
  assert.equal(first.stateId, s.id);
  assert.equal(last.stateId, s.id);
  assert(last.householdSize >= last.householdMember);
  assert.equal(first.synthetic, true);
  assert(first.age >= 0 && first.age < 90);
  const next = engine.citizen(s.offset + 1, states);
  assert.equal(first.householdId, next.householdId);
  assert.equal(first.householdMonthlyIncome, next.householdMonthlyIncome);
  assert.equal(first.safeWaterAccess, next.safeWaterAccess);
}
const ids = new Set();
for (let i = 0; i < 10000; i++) ids.add(engine.citizen(i, states).id);
assert.equal(ids.size, 10000);
console.log(
  "Passed: exact population coverage, reproducibility, citizen ID boundaries, 37 state ranges, household consistency and sample uniqueness.",
);
for (let i = 0; i < 1000; i++) {
  const c = engine.citizen(i, states);
  assert(
    ["Christian", "Muslim", "Traditional belief", "No religion", "Not stated"].includes(c.religion),
  );
  assert.equal(typeof c.digitalAccess, "boolean");
  assert(c.primaryLanguage);
  assert(c.educationLevel);
  assert(c.disabilitySupportNeed);
  assert(c.employmentStatus);
  assert(c.climateExposure);
  assert.equal(c.generatorVersion, "aderin-citizens-v2");
}
console.log(
  "Passed: v2 religion, language, accessibility, education, employment, digital access and climate attributes.",
);
