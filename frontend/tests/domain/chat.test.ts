import assert from "node:assert/strict";
import { test } from "node:test";
import { answerLedger, type LedgerRow } from "../../lib/domain/chat";
import { buildLineItems } from "../../lib/db/seed/ledger";

test("an empty ledger says no spending records are loaded", () => {
  assert.equal(buildLineItems().length, 0);
  assert.equal(
    answerLedger("How much was spent on education in Ikeja?", []),
    "No spending records are loaded.",
  );
});

test("named ledger rows still answer a place and sector", () => {
  const rows: LedgerRow[] = [
    {
      lga: "Ikeja",
      mda: "Ministry of Education",
      sector: "education",
      kind: "capital",
      amountNaira: 400_000_000,
    },
    {
      lga: "Ikeja",
      mda: "Ministry of Education",
      sector: "education",
      kind: "recurrent",
      amountNaira: 850_000_000,
    },
  ];
  assert.equal(
    answerLedger("How much was spent on education in Ikeja?", rows),
    "In Ikeja, the Ministry of Education spent ₦1,250,000,000 on 2 capital and recurrent projects in 2026.",
  );
});
