/** Transparent budget arithmetic, not a causal forecast of jobs, GDP or service outcomes. */
import { SECTORS, STRATEGIES } from "./constants.mjs";

export function validatePlan(input) {
  const fail = (message) => {
    throw Object.assign(Error(message), { status: 400 });
  };
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("Send a planning configuration.");
  const {
    years,
    startYear,
    annualBudgetNaira,
    inflation,
    budgetGrowth,
    revenueGrowth,
    delivery,
    maintenance,
    scope,
    allocations,
  } = input;
  if (![5, 10].includes(years)) fail("Choose a five- or ten-year horizon.");
  if (!Number.isInteger(startYear) || startYear < 2026 || startYear > 2040)
    fail("Start year must be 2026–2040.");
  if (
    !Number.isSafeInteger(annualBudgetNaira) ||
    annualBudgetNaira <= 0 ||
    annualBudgetNaira > 1e14
  )
    fail("Annual investment must be positive whole naira and at most ₦100tn.");
  for (const [label, value, min, max] of [
    ["Inflation", inflation, 0, 100],
    ["Budget growth", budgetGrowth, -20, 25],
    ["Revenue growth", revenueGrowth, -20, 25],
    ["Delivery", delivery, 0, 100],
    ["Maintenance", maintenance, 0, 50],
  ]) {
    if (!Number.isFinite(value) || value < min || value > max)
      fail(`${label} must be between ${min} and ${max} percent.`);
  }
  if (typeof scope !== "string") fail("Choose a geographic scope.");
  if (!allocations || Object.keys(allocations).length !== Object.keys(SECTORS).length)
    fail("Supply all six sector allocations.");
  const total = Object.keys(SECTORS).reduce((sum, key) => {
    if (!Number.isSafeInteger(allocations[key]) || allocations[key] < 0)
      fail("Sector amounts must be non-negative whole naira.");
    return sum + allocations[key];
  }, 0);
  if (total !== annualBudgetNaira)
    fail("Sector amounts must sum exactly to the annual investment budget.");
  return {
    years,
    startYear,
    annualBudgetNaira,
    inflation,
    budgetGrowth,
    revenueGrowth,
    delivery,
    maintenance,
    scope,
    allocations: { ...allocations },
  };
}

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
    weights: Object.fromEntries(
      rows.map((row, index) => [row.key, preference.weights[index] / sum]),
    ),
    explanation:
      "These weights are a preference you picked. They aren't proof that one sector works better. Largest remainders is how rounding is shared so the total stays the same.",
  };
}

export function projectPlan(input, context) {
  const config = validatePlan(input);
  const annual = Array.from({ length: config.years }, (_, index) => {
    const year = config.startYear + index;
    const nominal = Math.round(config.annualBudgetNaira * (1 + config.budgetGrowth / 100) ** index);
    const priceIndex = (1 + config.inflation / 100) ** index;
    const maintenanceNaira = Math.round((nominal * config.maintenance) / 100);
    const deliveryAdjustedCapitalNaira = Math.round(
      ((nominal - maintenanceNaira) * config.delivery) / 100,
    );
    const projectedIgrNaira = Math.round(
      context.referenceRevenueNaira *
        (1 + config.revenueGrowth / 100) ** (year - context.revenueYear),
    );
    return {
      year,
      nominalNaira: nominal,
      constantPriceNaira: Math.round(nominal / priceIndex),
      maintenanceNaira,
      deliveryAdjustedCapitalNaira,
      constantPriceCapitalNaira: Math.round(deliveryAdjustedCapitalNaira / priceIndex),
      projectedIgrNaira,
      investmentToIgrPercent: projectedIgrNaira > 0 ? (nominal / projectedIgrNaira) * 100 : null,
    };
  });
  const total = (key) => annual.reduce((sum, row) => sum + row[key], 0);
  const flags = [];
  if (config.inflation > config.budgetGrowth)
    flags.push(
      "The budget is set to grow more slowly than your inflation guess, so buying power falls.",
    );
  if (config.delivery < 80)
    flags.push(
      "Delivery is below 80%. Check whether the work can actually be carried out before you commit more.",
    );
  if (annual.some((row) => row.investmentToIgrPercent > 100))
    flags.push(
      "In some years the plan is larger than the projected IGR. That's a funding question, not a calculated deficit.",
    );
  return {
    version: "ng-budget-arithmetic-v1",
    config,
    context,
    annual,
    totals: {
      nominalNaira: total("nominalNaira"),
      constantPriceNaira: total("constantPriceNaira"),
      deliveryAdjustedCapitalNaira: total("deliveryAdjustedCapitalNaira"),
    },
    flags,
    formulas: [
      "Nominal year t = first-year budget × (1 + budget growth)^t",
      "Constant-price budget = nominal budget / (1 + inflation)^t",
      "Maintenance = nominal budget × maintenance share",
      "Delivery-adjusted capital = (nominal budget − maintenance) × delivery share",
      "Projected IGR = observed IGR × (1 + assumed revenue growth)^(year − observation year)",
    ],
    limitations: [
      "Every future rate and sector weight is a guess you typed in. None of them is a measured effect.",
      "Delivery-adjusted capital is a money figure only. It doesn't count finished projects or benefits.",
      "This doesn't predict jobs, GDP, school attendance, travel time, or health results.",
      context.warning,
    ],
    roadmap: [
      "Before you commit: check project costs, procurement, and whether the sources cover the question.",
      "Each quarter: look at money paid out, milestones, and evidence that work was delivered.",
      "Each year: compare what actually happened with the guesses you saved, and write that review down separately.",
    ],
  };
}
