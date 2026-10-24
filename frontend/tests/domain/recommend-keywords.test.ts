import assert from "node:assert/strict";
import { test } from "node:test";
import { recommend } from "../../lib/domain/recommend";

test("naming healthcare raises its share against an unnamed question", () => {
  const plain = recommend(
    {
      question: "Distribute the envelope across the federation",
      budget: 100_000,
      horizon: 5,
      strategy: "balance",
    },
    "15.06%",
    37,
  );
  const named = recommend(
    {
      question: "Put more into healthcare and hospitals",
      budget: 100_000,
      horizon: 5,
      strategy: "balance",
    },
    "15.06%",
    37,
  );
  assert.ok(named.budgets.health > plain.budgets.health);
});
