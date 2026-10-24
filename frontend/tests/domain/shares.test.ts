import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFaac, STATES_TIER_MILLION } from "../../lib/db/seed/faac";
import { JURISDICTIONS } from "../../lib/db/seed/jurisdictions";

test("each share matches its amount within a tenth of a point", () => {
  for (const row of buildFaac(JURISDICTIONS)) {
    const exact = (row.amountMillion / STATES_TIER_MILLION) * 100;
    assert.ok(Math.abs(row.sharePercent - exact) < 0.06);
  }
});
