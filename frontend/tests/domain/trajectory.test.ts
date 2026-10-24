import assert from "node:assert/strict";
import { test } from "node:test";
import { GDP_GROWTH, SNAPSHOT } from "../../lib/db/seed/cited";

test("third-reading components stay as published and do not add to 68.3", () => {
  const parts =
    SNAPSHOT.statutoryNaira + SNAPSHOT.recurrentNaira + SNAPSHOT.debtNaira + SNAPSHOT.capitalNaira;
  assert.equal(SNAPSHOT.approvedNaira, 68.3e12);
  assert.ok(Math.abs(parts - 68.19e12) < 1e9);
  assert.notEqual(parts, SNAPSHOT.approvedNaira);
});

test("scenario growth is the cited Q4 2025 real GDP rate", () => {
  assert.equal(GDP_GROWTH, 0.0407);
  assert.equal(SNAPSHOT.revenueTargetNaira, 34.33e12);
});
