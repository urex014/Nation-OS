import { SECTORS, STRATEGIES } from "./constants.mjs";

/** Float largest-remainder split. The total stays exact. */
export function allocateBudget(annualBudgetNaira, strategy = "balanced") {
  if (
    !Number.isSafeInteger(annualBudgetNaira) ||
    annualBudgetNaira <= 0 ||
    annualBudgetNaira > 1e14
  )
    throw Object.assign(Error("Enter a valid annual investment amount."), { status: 400 });
  const preference = Object.hasOwn(STRATEGIES, strategy) ? STRATEGIES[strategy] : null;
  if (!preference) throw Object.assign(Error("Unknown allocation preference."), { status: 400 });
  const sum = preference.weights.reduce((a, b) => a + b, 0);
  const rows = Object.keys(SECTORS).map((key, index) => ({
    key,
    raw: (annualBudgetNaira * preference.weights[index]) / sum,
  }));
  const allocations = Object.fromEntries(rows.map((row) => [row.key, Math.floor(row.raw)]));
  let remainder = annualBudgetNaira - Object.values(allocations).reduce((a, b) => a + b, 0);
  for (const row of [...rows].sort((a, b) => (b.raw % 1) - (a.raw % 1))) {
    if (!remainder) break;
    allocations[row.key]++;
    remainder--;
  }
  return {
    allocations,
    strategy,
    label: preference.label,
    weights: Object.fromEntries(rows.map((row, index) => [row.key, preference.weights[index] / sum])),
    explanation:
      "These weights are a preference you picked. They aren't proof that one sector works better. Largest remainders is how rounding is shared so the total stays the same.",
  };
}
