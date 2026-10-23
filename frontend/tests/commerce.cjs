const assert = require("node:assert/strict"),
  { build } = require("../lib/domain/commerce-engine.cjs"),
  states = require("../data/citizen-states.cjs");
const c = build(states),
  f = c.financial,
  close = (a, b) => assert(Math.abs(a - b) < 1e-7);
assert.equal(c.totalBusinesses, 24600);
assert.equal(
  c.summary.reduce((n, s) => n + s.businesses, 0),
  24600,
);
for (const s of c.summary) assert.equal(s.domestic + s.foreign + s.joint, s.businesses);
assert.deepEqual(c.business(0), c.business(0));
assert.equal(c.business(24599).id, "AD-F-024600");
assert.throws(() => c.business(24600), RangeError);
for (let i = 0; i < 24600; i++) {
  const b = c.business(i);
  assert(b.employees > 0);
  assert(b.annualTurnoverMillions > 0);
  assert(c.banks.some((bank) => bank.id === b.bankId));
  assert.equal(
    b.ownership,
    b.domesticOwnershipPercent > 50
      ? "Domestic-controlled"
      : b.domesticOwnershipPercent < 50
        ? "Foreign-controlled"
        : "Joint control",
  );
}
assert.equal(c.banks.length, 8);
assert.equal(c.banks.filter((b) => b.ownership === "Foreign-controlled").length, 2);
for (const b of c.banks) {
  close(b.totalAssets, b.loans + b.governmentSecurities + b.reserves + b.vaultCash + b.otherAssets);
  close(b.totalAssets, b.totalLiabilitiesAndEquity);
  assert.equal(
    b.branches,
    b.branchesByState.reduce((a, v) => a + v, 0),
  );
}
close(
  c.banks.reduce((n, b) => n + b.deposits, 0),
  f.totalDeposits,
);
close(
  c.banks.reduce((n, b) => n + b.vaultCash, 0),
  f.vaultCash,
);
assert.equal(f.currencyIssued, f.currencyOutsideBanks + f.vaultCash);
assert.equal(f.narrowMoney, f.currencyOutsideBanks + f.overnightDeposits);
assert.equal(f.extendedMoney, f.narrowMoney + f.shortTermDeposits);
assert.equal(f.monetaryBase, f.currencyIssued + f.reservesAtCentralBank);
console.log(
  "Passed: 24,600 reproducible firms, ownership categories, bank relationships, state counts, branch allocation, bank balance sheets and monetary aggregate identities.",
);
