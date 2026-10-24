import assert from "node:assert/strict";
import { test } from "node:test";
import { FEDERAL_SHARE, LOCAL_SHARE, STATE_SHARE, verticalSplit } from "../../lib/domain/formula";
import { STATES_TIER_MILLION } from "../../lib/db/seed/faac";

test("statutory weights sum to one", () => {
  assert.ok(Math.abs(FEDERAL_SHARE + STATE_SHARE + LOCAL_SHARE - 1) < 1e-12);
});

test("vertical split rebuilds the pool from the states tier", () => {
  const split = verticalSplit(STATES_TIER_MILLION);
  assert.ok(Math.abs(split.federal + split.states + split.local - split.pool) < 1e-6);
  assert.equal(split.states, STATES_TIER_MILLION);
  assert.ok(Math.abs(split.federal / split.pool - FEDERAL_SHARE) < 1e-12);
  assert.ok(Math.abs(split.local / split.pool - LOCAL_SHARE) < 1e-9);
});
