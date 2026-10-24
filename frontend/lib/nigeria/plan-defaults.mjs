import { SECTORS } from "./constants.mjs";
import { allocateBudget } from "./allocate.mjs";
import { getIndicators } from "./repository.mjs";

export function storedInflation() {
  const row = getIndicators().find((item) => item.code === "FP.CPI.TOTL.ZG" && item.value != null);
  return {
    value: row?.value ?? null,
    year: row?.year ?? null,
    sourceId: row?.sourceId ?? "worldbank-wdi-ng",
  };
}

function assumption(partial, key, text) {
  return partial[key] == null ? text : null;
}

/** Fill a plan when the person did not set every field. Defaults are labelled as assumptions. */
export function fillPlan(partial = {}) {
  const fail = (message) => {
    throw Object.assign(Error(message), { status: 400 });
  };
  const inflationRow = storedInflation();
  const envelope = partial.annualBudgetNaira;
  if (!Number.isSafeInteger(envelope) || envelope <= 0) {
    fail("Type the amount to plan. A state budget is not loaded, so there is nothing to fill in.");
  }
  const salariesNaira = partial.salariesNaira ?? 0;
  const debtServiceNaira = partial.debtServiceNaira ?? 0;
  const committedMaintenanceNaira = partial.committedMaintenanceNaira ?? 0;
  const committed = salariesNaira + debtServiceNaira + committedMaintenanceNaira;
  if (committed > envelope) fail("Salaries, debt and maintenance are larger than the amount.");
  const left = envelope - committed;
  const strategy = partial.strategy || "balanced";
  const given = partial.allocations;
  const complete = given && Object.keys(SECTORS).every((key) => Number.isSafeInteger(given[key]));
  const allocations = complete ? given : allocateBudget(left, strategy).allocations;
  const filledMissing = Boolean(given) && !complete;
  const inflation = partial.inflation ?? inflationRow.value;
  if (!Number.isFinite(inflation)) {
    fail("The stored inflation figure is missing, so name a rate to use as a guess.");
  }
  const assumptions = [
    assumption(partial, "years", "Horizon is 5 years because you didn't name one."),
    assumption(partial, "startYear", "The plan starts in 2026 because you didn't name a year."),
    assumption(
      partial,
      "inflation",
      `Inflation is ${inflation}% because that's the stored World Bank ${inflationRow.year} rate, used as a guess.`,
    ),
    assumption(partial, "delivery", "Delivery is 80% because you didn't set it."),
    assumption(partial, "maintenance", "Maintenance is 10% because you didn't set it."),
    partial.budgetGrowth == null && partial.revenueGrowth == null
      ? "Budget growth and revenue growth are 0% because you didn't set them."
      : null,
    (partial.scope || "all") !== "all"
      ? "That place's own budget is not loaded. This uses the amount you entered."
      : null,
    filledMissing
      ? `Some sectors were missing, so the split uses the ${strategy} default instead of a partial list.`
      : null,
  ].filter(Boolean);
  return {
    assumptions,
    inflationSourceId: partial.inflation == null ? inflationRow.sourceId : null,
    input: {
      years: partial.years ?? 5,
      startYear: partial.startYear ?? 2026,
      annualBudgetNaira: envelope,
      inflation,
      budgetGrowth: partial.budgetGrowth ?? 0,
      revenueGrowth: partial.revenueGrowth ?? 0,
      delivery: partial.delivery ?? 80,
      maintenance: partial.maintenance ?? 10,
      scope: partial.scope || "all",
      allocations,
      strategy,
      salariesNaira,
      debtServiceNaira,
      committedMaintenanceNaira,
      borrowingNaira: partial.borrowingNaira ?? 0,
      projectNaira: partial.projectNaira ?? null,
      overrideProjectCap: partial.overrideProjectCap === true,
    },
  };
}
