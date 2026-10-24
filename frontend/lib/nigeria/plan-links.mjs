import { SECTORS } from "./constants.mjs";

const FIELDS = [
  ["years", "years"],
  ["startYear", "startYear"],
  ["scope", "scope"],
  ["inflation", "inflation"],
  ["budgetGrowth", "budgetGrowth"],
  ["revenueGrowth", "revenueGrowth"],
  ["delivery", "delivery"],
  ["maintenance", "maintenance"],
  ["strategy", "strategy"],
  ["annualBudgetNaira", "budget"],
  ["projectNaira", "project"],
  ["borrowingNaira", "borrowing"],
  ["salariesNaira", "salaries"],
  ["debtServiceNaira", "debt"],
  ["committedMaintenanceNaira", "upkeep"],
];

export function budgetQuery(input = {}) {
  const params = new URLSearchParams();
  params.set("from", "ai");
  for (const [key, name] of FIELDS) {
    if (input[key] != null && input[key] !== "") params.set(name, String(input[key]));
  }
  if (input.overrideProjectCap) params.set("override", "1");
  if (input.option) params.set("option", String(input.option));
  if (input.phase) params.set("phase", String(input.phase));
  if (input.gapNaira != null) params.set("gap", String(input.gapNaira));
  for (const key of Object.keys(SECTORS)) {
    if (input.allocations?.[key] != null) params.set(key, String(input.allocations[key]));
  }
  return params;
}

export function planPageHref(input) {
  return `/budget?${budgetQuery(input)}`;
}

export function scenarioPageHref(input) {
  return `/scenarios?${budgetQuery(input)}`;
}

function numeric(params, name) {
  if (!params.has(name)) return undefined;
  const value = Number(params.get(name));
  return Number.isFinite(value) ? value : undefined;
}

/** Partial plan fields from a What-if or Plan a budget link. */
export function readPlanQuery(params) {
  const keys = ["budget", "years", "startYear", "scope", "project", "education", "from"];
  if (!keys.some((key) => params.has(key))) return null;
  const partial = { fromLink: params.get("from") === "ai" };
  const budget = numeric(params, "budget");
  if (budget != null) partial.annualBudgetNaira = Math.round(budget);
  for (const [key, name] of FIELDS) {
    if (name === "budget") continue;
    const value = name === "scope" || name === "strategy" ? params.get(name) : numeric(params, name);
    if (value != null && value !== "") partial[key] = name === "scope" || name === "strategy" ? value : value;
  }
  if (params.get("override") === "1") partial.overrideProjectCap = true;
  if (params.get("option")) partial.option = params.get("option");
  if (params.get("phase")) partial.phase = params.get("phase");
  const gap = numeric(params, "gap");
  if (gap != null) partial.gapNaira = Math.round(gap);
  const allocations = {};
  let seen = false;
  for (const key of Object.keys(SECTORS)) {
    const value = numeric(params, key);
    if (value == null) continue;
    allocations[key] = Math.round(value);
    seen = true;
  }
  if (seen) partial.allocations = allocations;
  return partial;
}
