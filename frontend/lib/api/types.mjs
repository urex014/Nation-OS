/**
 * NationOS Fiscal Intelligence API Contracts and Typings
 * Canonical schemas and data representation for fiscal intelligence workflows.
 */

export const CURRENCY = {
  code: "NGN",
  symbol: "₦",
  demonstrationCode: "AND",
  demonstrationSymbol: "A₦",
  unitLabel: "million",
};

export const PROTOTYPE_STATUSES = ["Draft", "Under review", "Reviewed", "Rejected"];

export const SECTOR_KEYS = ["education", "health", "transport", "food", "energy", "water"];

export const ALLOCATION_STRATEGIES = [
  {
    id: "balanced",
    label: "Balanced allocation",
    description: "Even distribution across vital sectors",
  },
  {
    id: "needs",
    label: "Needs-based allocation",
    description: "Prioritizes historically underserved jurisdictions",
  },
  {
    id: "growth",
    label: "Growth-oriented allocation",
    description: "Focuses on high-multiplier infrastructure and energy",
  },
  {
    id: "custom",
    label: "Custom allocation",
    description: "Analyst-configured sector ceilings and priorities",
  },
];

export const STATUTORY_FORMULA = {
  id: "statutory-v1",
  name: "Statutory Distribution Formula (2026)",
  isStatutory: true,
  weights: {
    equality: 0.4,
    population: 0.3,
    landmass: 0.1,
    internalRevenueEffort: 0.1,
    socialDevelopment: 0.1,
  },
  tiers: {
    federal: 0.5268,
    state: 0.2672,
    local: 0.206,
  },
  legalBasis: "National Allocation Act Cap F26 LFN 2004",
};

export const HYPOTHETICAL_FORMULA = {
  id: "scenario-needs-v1",
  name: "Experimental Needs-Weighted Formula",
  isStatutory: false,
  weights: {
    equality: 0.25,
    population: 0.35,
    landmass: 0.1,
    internalRevenueEffort: 0.1,
    socialDevelopment: 0.2,
  },
  tiers: {
    federal: 0.485,
    state: 0.315,
    local: 0.2,
  },
  legalBasis: "Hypothetical policy simulation (non-statutory)",
};

export function formatCurrency(amount, { demonstration = true, fractionDigits = 1 } = {}) {
  const sym = demonstration ? CURRENCY.demonstrationSymbol : CURRENCY.symbol;
  const num = Number(amount || 0).toLocaleString("en-GB", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${sym} ${num}M`;
}

export function formatPercent(value, fractionDigits = 1) {
  const num = Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${num}%`;
}
