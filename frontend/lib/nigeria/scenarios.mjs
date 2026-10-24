import { projectPlan } from "./planning.mjs";

export function compareScenarios(config, context) {
  // Vary one assumption at a time. These are stress cases, not confidence intervals.
  const variants = [
    ["as-entered", "As entered", "Current user assumptions", config],
    [
      "delivery",
      "Lower delivery",
      "Delivery minus 20 percentage points",
      { ...config, delivery: Math.max(0, config.delivery - 20) },
    ],
    [
      "inflation",
      "Higher inflation",
      "Inflation plus 5 percentage points",
      { ...config, inflation: Math.min(100, config.inflation + 5) },
    ],
    [
      "growth",
      "Budget escalation",
      "Annual budget growth plus 5 percentage points",
      { ...config, budgetGrowth: Math.min(25, config.budgetGrowth + 5) },
    ],
  ];
  return variants.map(([id, label, change, input]) => ({
    id,
    label,
    change,
    result: projectPlan(input, context),
  }));
}
