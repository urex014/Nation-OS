import assert from "node:assert/strict";
import { test } from "node:test";
import { shortfall } from "../../lib/domain/allocate";
import { buildLineItems } from "../../lib/db/seed/ledger";

test("a seeded ledger with no overhead rows reports a zero cut", () => {
  const items = buildLineItems();
  const overhead = items
    .filter((item) => item.category === "overhead")
    .reduce((sum, item) => sum + item.amountNaira, 0);
  const result = shortfall(15, overhead, 0);
  assert.equal(result.cut, 0);
  assert.equal(
    result.sentence,
    "No overhead records are loaded, so the cut is ₦0. Capital stays the same.",
  );
});

test("a revenue drop cuts overhead by that share when records exist", () => {
  const result = shortfall(15, 2_000_000, 8);
  assert.equal(result.cut, 300_000);
  assert.match(result.sentence, /15%/);
  assert.match(result.sentence, /Capital stays the same/);
});
