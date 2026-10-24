import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFaac, STATES_TIER_MILLION } from "../../lib/db/seed/faac";
import { FAAC_HEADLINE_MILLION } from "../../lib/db/seed/cited";
import { JURISDICTIONS } from "../../lib/db/seed/jurisdictions";

test("36 state allocations are published and sum to the listed tier", () => {
  const rows = buildFaac(JURISDICTIONS);
  assert.equal(rows.length, 36);
  assert.ok(rows.every((row) => row.provenance === "published"));
  assert.equal(
    rows.reduce((sum, row) => sum + row.amountMillion, 0),
    STATES_TIER_MILLION,
  );
});

test("the FCT is outside the 36-state table", () => {
  const rows = buildFaac(JURISDICTIONS);
  assert.equal(
    rows.some((row) => row.id === "NG-FC"),
    false,
  );
});

test("the listed state sum is not forced to the ₦8.43tn headline", () => {
  assert.equal(FAAC_HEADLINE_MILLION, 8_430_000);
  assert.equal(STATES_TIER_MILLION, 8_434_240);
  assert.notEqual(STATES_TIER_MILLION, FAAC_HEADLINE_MILLION);
});
