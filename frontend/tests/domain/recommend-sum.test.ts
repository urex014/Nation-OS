import assert from "node:assert/strict";
import { test } from "node:test";
import { recommend } from "../../lib/domain/recommend";

test("sector budgets sum to the envelope and stay non-negative", () => {
  const result = recommend(
    {
      question:
        "Distribute ₦100bn to improve healthcare and education while prioritizing underserved states",
      budget: 100_000,
      horizon: 5,
      strategy: "needs",
    },
    "15.06%",
    37,
  );
  const values = Object.values(result.budgets);
  assert.equal(
    values.reduce((sum, value) => sum + value, 0),
    100_000,
  );
  assert.ok(values.every((value) => value > 0));
  assert.equal(result.investigationStages.length, 6);
});
