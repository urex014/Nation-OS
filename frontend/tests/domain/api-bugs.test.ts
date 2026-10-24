import assert from "node:assert/strict";
import { test } from "node:test";
import { readDecimal, readWhole } from "../../lib/api/params";
import { answerLedger } from "../../lib/domain/chat";
import { recommend } from "../../lib/domain/recommend";
import { parseRecommend } from "../../lib/db/ledger";

const rows = [
  {
    lga: "Ikeja",
    mda: "Ministry of Education",
    sector: "education",
    kind: "capital",
    amountNaira: 400_000_000,
  },
  {
    lga: "Alimosho",
    mda: "Ministry of Education",
    sector: "education",
    kind: "capital",
    amountNaira: 100_000_000,
  },
];

test("a blank or scientific year is rejected, and a missing year uses 2026", () => {
  assert.equal(readWhole(null, 2026), 2026);
  assert.equal(readWhole("", 2026), null);
  assert.equal(readWhole("1e21", 2026), null);
  assert.equal(readWhole("1.5", 2026), null);
  assert.equal(readWhole("2026", 2026), 2026);
});

test("a blank revenue drop is rejected, and an explicit zero is kept", () => {
  assert.equal(readDecimal(null, 15), 15);
  assert.equal(readDecimal("", 15), null);
  assert.equal(readDecimal("15e0", 15), null);
  assert.equal(readDecimal("0", 15), 0);
  assert.equal(readDecimal("15.5", 15), 15.5);
});

test("a fractional budget is rejected before it can be rounded", () => {
  const body = {
    question: "Fund clinics and schools in underserved states now",
    budget: 0.4,
    horizon: 5,
    strategy: "needs",
  };
  assert.equal(
    parseRecommend(body),
    "Budget must be a whole number from 1 to 1000000000. The unit is million naira.",
  );
  assert.equal(typeof parseRecommend({ ...body, budget: 1 }), "object");
});

test("clinic uses the same health words as the budget weights", () => {
  const result = recommend(
    {
      question: "Fund clinics and schools in underserved states now",
      budget: 100_000,
      horizon: 5,
      strategy: "needs",
    },
    "15.06%",
    37,
  );
  assert.ok(result.tradeoffs.includes("Health and education get more. Roads and power get less."));
  assert.equal(
    Object.values(result.budgets).reduce((sum, value) => sum + value, 0),
    100_000,
  );
});

test("two named places ask for one place instead of picking the longer name", () => {
  const answer = answerLedger("How much was spent on education in Ikeja and Alimosho?", rows);
  assert.equal(answer, "Name one place: Alimosho or Ikeja.");
});
