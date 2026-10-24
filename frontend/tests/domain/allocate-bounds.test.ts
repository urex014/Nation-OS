import assert from "node:assert/strict";
import { test } from "node:test";
import { shortfall } from "../../lib/domain/allocate";

test("zero drop cuts nothing and a full drop cuts all overhead", () => {
  assert.equal(shortfall(0, 2_000, 8).cut, 0);
  assert.equal(shortfall(100, 2_000, 8).cut, 2_000);
});

test("drops outside 0 to 100 are rejected", () => {
  assert.throws(() => shortfall(-1, 2_000, 8));
  assert.throws(() => shortfall(101, 2_000, 8));
});
