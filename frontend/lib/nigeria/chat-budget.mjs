import { calculate } from "./calculate.mjs";
import { getDatabase } from "./database.mjs";
import { describeNaira } from "./money.mjs";
import { SECTORS } from "./constants.mjs";
import { illustrateTax } from "./illustrate.mjs";
import { fillPlan } from "./plan-defaults.mjs";
import { planPageHref, scenarioPageHref } from "./plan-links.mjs";
import { checkProjectRequest } from "./project-check.mjs";
import { allocateBudget } from "./allocate.mjs";
import { projectPlan, validatePlan } from "./planning.mjs";
import { getJurisdictions, getPlanningContext, getRevenue } from "./repository.mjs";

function federalBudget() {
  return getDatabase()
    .prepare("select year, approved_naira, source_id from federal_budgets order by year desc limit 1")
    .get();
}

function parseAmount(text) {
  const match = String(text).match(
    /(\d[\d,]*(?:\.\d+)?)\s*(tn|trillion|bn|billion|million|mn|m)\b/i,
  );
  if (!match) return null;
  const number = Number(match[1].replace(/,/g, ""));
  const unit = match[2].toLowerCase();
  const scale = unit.startsWith("t") ? 1e12 : unit.startsWith("b") ? 1e9 : 1e6;
  const naira = Math.round(number * scale);
  return Number.isSafeInteger(naira) ? naira : null;
}

function citizenStop() {
  return {
    paragraphs: [
      "This seat can work out a percentage of a published figure. It cannot split a budget or run a projection.",
    ],
    sourceIds: [],
  };
}

function percentOfBudget(message) {
  const match = message.match(
    /(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(?:the\s+)?(20\d{2})\s+(?:annual\s+)?(?:federal\s+)?budget/i,
  );
  if (!match) return null;
  const percent = Number(match[1]);
  const year = Number(match[2]);
  const budget = federalBudget();
  if (!budget || budget.year !== year) {
    return {
      paragraphs: [
        `Only the ${budget?.year ?? "loaded"} approved federal budget is imported. I have not guessed a ${year} figure.`,
      ],
      sourceIds: budget ? [budget.source_id] : [],
    };
  }
  const worked = calculate({
    operation: "percentOf",
    amount: budget.approved_naira,
    percent,
    source: `the approved ${budget.year} federal budget`,
  });
  return {
    paragraphs: [
      `${percent}% of the approved ${budget.year} federal budget is ${worked.display} (${worked.displayFull}). That's calculated from ${describeNaira(budget.approved_naira).short}, the published appropriation.`,
      "This is the federal headline, not a state budget and not money already set aside.",
    ],
    sourceIds: [budget.source_id],
    work: [worked],
    links: [],
  };
}

function allocation(message, role) {
  if (!/\b(allocate|allocation|split)\b/i.test(message) || !/\b(sector|sectors|budget|bn|billion|naira)\b/i.test(message)) {
    return null;
  }
  if (role !== "government") return citizenStop();
  const amount = parseAmount(message);
  if (!amount) {
    return {
      paragraphs: [
        "Say the amount to split, for example ₦500bn. No state budget is loaded to fill that in.",
      ],
      sourceIds: [],
    };
  }
  const strategy = /infrastructure/i.test(message)
    ? "infrastructure"
    : /social/i.test(message)
      ? "social"
      : "balanced";
  const split = allocateBudget(amount, strategy);
  const rows = Object.keys(SECTORS).map(
    (key) => `${SECTORS[key]} ${describeNaira(split.allocations[key]).short}`,
  );
  const config = validatePlan({
    years: 5,
    startYear: 2026,
    annualBudgetNaira: amount,
    inflation: 0,
    budgetGrowth: 0,
    revenueGrowth: 0,
    delivery: 80,
    maintenance: 10,
    scope: "all",
    allocations: split.allocations,
    strategy,
  });
  const result = projectPlan(config, getPlanningContext("all"));
  const warnings = result.flags;
  const shown = describeNaira(amount);
  return {
    paragraphs: [
      `A ${split.label.toLowerCase()} puts ${shown.short} (${shown.full}) across six sectors: ${rows.join(", ")}. You entered this amount.`,
      "Those weights are a preference, not proof that one sector works better. Nothing is saved until you save it on the plan page.",
      ...warnings,
    ],
    sourceIds: [],
    work: [
      {
        formula: `${split.label} of ${shown.short}, largest remainder`,
        inputs: [{ label: "Amount", display: `${shown.short} (${shown.full})`, enteredByUser: true }],
        source: "the amount you typed",
        enteredByUser: true,
      },
    ],
    links: [{ href: planPageHref({ ...config, strategy }), label: "Plan a budget" }],
    warnings,
    alternatives: result.alternatives || [],
    bestReason: result.bestReason || null,
  };
}

function projection(message, role) {
  if (!/\b(project|projection|simulate|simulation)\b/i.test(message)) return null;
  if (!/\b(5|five|10|ten)\b/i.test(message) || !/\b(year|budget|plan)\b/i.test(message)) return null;
  if (role !== "government") return citizenStop();
  const years = /\b(10|ten)\b/i.test(message) ? 10 : 5;
  const budget = federalBudget();
  const typed = parseAmount(message);
  const wantsFederal = /\bfederal\b/i.test(message) || /\bannual budget\b/i.test(message);
  const amount = typed || (wantsFederal ? budget?.approved_naira : null);
  if (!amount) {
    return {
      paragraphs: [
        "No state budget is loaded. Type an amount, or ask to project the approved federal budget.",
      ],
      sourceIds: budget ? [budget.source_id] : [],
    };
  }
  const filled = fillPlan({
    annualBudgetNaira: amount,
    years,
    scope: "all",
    strategy: "balanced",
  });
  const config = validatePlan(filled.input);
  const result = projectPlan(config, getPlanningContext(config.scope));
  const nominal = describeNaira(result.totals.nominalNaira);
  return {
    paragraphs: [
      `Over ${years} years, the nominal total is ${nominal.short} (${nominal.full}). ${filled.assumptions.join(" ")}`,
      "This is conditional budget arithmetic, not a forecast of jobs or services. Nothing is saved until you save it.",
      ...result.flags,
    ],
    sourceIds: [result.context.sourceId, filled.inflationSourceId].filter(Boolean),
    work: [
      {
        formula: result.formulas[0],
        inputs: filled.assumptions.map((item) => ({ label: "Assumption", display: item, enteredByUser: false })),
        source: wantsFederal ? `the approved ${budget.year} federal budget` : "the amount you typed",
        enteredByUser: Boolean(typed),
      },
    ],
    links: [{ href: scenarioPageHref({ ...config, strategy: "balanced" }), label: "Open in What-if tests" }],
    warnings: result.flags,
    alternatives: result.alternatives || [],
    bestReason: result.bestReason || null,
    result,
  };
}

function taxWhatIf(message, role) {
  if (!/\bwhat if\b/i.test(message) || !/\btax\b/i.test(message)) return null;
  if (role !== "government") {
    return {
      paragraphs: [
        "That tax what-if is for a government seat. This seat can still ask what percent one amount is of another.",
      ],
      sourceIds: [],
    };
  }
  const match = message.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(lower|higher|less|more)/i);
  if (!match) return null;
  const percent = Math.round(Number(match[1]));
  const signed = /lower|less/i.test(match[2]) ? -percent : percent;
  const named = getJurisdictions().find((state) => new RegExp(`\\b${state.name}\\b`, "i").test(message));
  if (!named) {
    return { paragraphs: ["Name the state, for example Lagos, and how much higher or lower."], sourceIds: [] };
  }
  const revenue = getRevenue();
  const row = revenue.states.find((item) => item.id === named.id);
  const stored = getDatabase()
    .prepare("select tax_kobo, other_kobo from state_revenue where state_id = ? and year = ?")
    .get(named.id, revenue.year);
  if (!row || stored?.tax_kobo == null) {
    return {
      paragraphs: [`Published tax for ${named.name} is not loaded. I have not guessed a figure.`],
      sourceIds: revenue?.sourceId ? [revenue.sourceId] : [],
    };
  }
  const illustrated = illustrateTax(stored.tax_kobo, stored.other_kobo, signed);
  const projected = describeNaira(Math.round(illustrated.taxKobo / 100));
  const published = describeNaira(Math.round(row.taxNaira));
  return {
    paragraphs: [
      `If ${named.name} tax collections were ${percent}% ${match[2].toLowerCase()}, the tax line would be ${projected.short} (${projected.full}), from the published ${published.short}. ${illustrated.projection}`,
    ],
    sourceIds: [revenue.sourceId],
    work: [
      {
        formula: "Projected tax = published tax kobo × (100 + percent) / 100",
        inputs: [
          { label: "Published tax", display: `${published.short} (${published.full})`, enteredByUser: false },
          { label: "Percent", display: `${signed}%`, enteredByUser: true },
        ],
        source: `published ${revenue.year} ${named.name} tax`,
        enteredByUser: false,
      },
    ],
    links: [],
    warnings: [],
  };
}

export function budgetFallback(message, role = "citizen", extra = {}) {
  return (
    checkProjectRequest({
      message,
      role,
      context: extra.context,
      history: extra.history,
      page: extra.page,
    }) ||
    percentOfBudget(message) ||
    allocation(message, role) ||
    projection(message, role) ||
    taxWhatIf(message, role)
  );
}
