import { tool } from "ai";
import { z } from "zod";
import { calculate, splitSectors } from "../nigeria/calculate.mjs";
import { SECTORS } from "../nigeria/constants.mjs";
import { fundsFor } from "../nigeria/funds.mjs";
import { describeNaira } from "../nigeria/money.mjs";
import { naira } from "../nigeria/format.mjs";
import { explainGuardrails } from "../nigeria/alternatives.mjs";
import { GUARDRAILS } from "../nigeria/guardrails.mjs";
import { illustrateTax } from "../nigeria/illustrate.mjs";
import { fillPlan } from "../nigeria/plan-defaults.mjs";
import { planPageHref, scenarioPageHref } from "../nigeria/plan-links.mjs";
import { allocateBudget } from "../nigeria/allocate.mjs";
import { projectPlan, validatePlan } from "../nigeria/planning.mjs";
import { getDatabase } from "../nigeria/database.mjs";
import { getPlanningContext, getRevenue } from "../nigeria/repository.mjs";
import { compareScenarios } from "../nigeria/scenarios.mjs";

const unit = z.enum(["naira", "kobo", "million", "billion", "trillion"]).optional();

function remember(transcript, result) {
  transcript.push(result);
  return result;
}

function caught(transcript, error, fallback) {
  return remember(transcript, {
    missing: true,
    blocked: Boolean(error?.blocked),
    note: error?.status || error?.blocked ? error.message : fallback,
  });
}

function sectorRows(allocations) {
  return Object.keys(SECTORS).map((key) => {
    const shown = describeNaira(allocations[key]);
    return { sector: SECTORS[key], key, naira: allocations[key], display: shown.short, displayFull: shown.full };
  });
}

export function createBudgetTools(role, transcript, helpers) {
  const calculateTool = tool({
    description:
      "Exact money arithmetic in kobo. Use this for every percent, share, sum, difference, growth, inflation adjustment, per-person figure, split, or unit change. Do not calculate it yourself.",
    inputSchema: z.object({
      operation: z.enum([
        "percentOf",
        "share",
        "sum",
        "difference",
        "growth",
        "inflationAdjust",
        "perCapita",
        "split",
        "convert",
      ]),
      amount: z.number().optional(),
      unit,
      other: z.number().optional(),
      otherUnit: unit,
      percent: z.number().optional(),
      values: z.array(z.number()).optional(),
      years: z.number().int().min(0).max(100).optional(),
      people: z.number().int().positive().optional(),
      splits: z.array(z.object({ label: z.string(), percent: z.number() })).optional(),
      toUnit: z.enum(["naira", "kobo", "million", "billion", "trillion"]).optional(),
      source: z.string().optional(),
      enteredByUser: z.boolean().optional(),
    }),
    execute: async (input) => {
      try {
        return remember(transcript, { calculated: true, ...calculate(input) });
      } catch (error) {
        return caught(transcript, error, "That calculation could not be run.");
      }
    },
  });
  if (role !== "government") return { calculate: calculateTool };

  return {
    calculate: calculateTool,
    allocateBudget: tool({
      description:
        "Split one amount across education, health, transport, agriculture, energy and water. Salaries, debt and maintenance come off first. Returns warnings. Does not save a decision.",
      inputSchema: z.object({
        amount: z.number(),
        unit: z.enum(["naira", "million", "billion", "trillion"]).optional(),
        strategy: z.enum(["balanced", "social", "infrastructure"]).optional(),
        percentages: z.record(z.string(), z.number()).optional(),
        salaries: z.number().optional(),
        debtService: z.number().optional(),
        maintenance: z.number().optional(),
        borrowing: z.number().optional(),
        project: z.number().optional(),
        overrideProjectCap: z.boolean().optional(),
        scope: z.string().optional(),
        enteredByUser: z.boolean().optional(),
      }),
      execute: async (input) => {
        try {
          const envelope = calculate({
            operation: "convert",
            amount: input.amount,
            unit: input.unit || "naira",
            toUnit: "naira",
            enteredByUser: input.enteredByUser,
            source: input.enteredByUser ? "the amount you typed" : "the amount given",
          }).resultNaira;
          const salaries = input.salaries ?? 0;
          const debt = input.debtService ?? 0;
          const upkeep = input.maintenance ?? 0;
          const committed = salaries + debt + upkeep;
          if (committed > envelope) {
            throw Object.assign(Error("Salaries, debt and maintenance are larger than the amount."), {
              status: 400,
            });
          }
          const left = envelope - committed;
          const allocations = input.percentages
            ? splitSectors(left, input.percentages)
            : allocateBudget(left, input.strategy || "balanced").allocations;
          const config = validatePlan({
            years: 5,
            startYear: 2026,
            annualBudgetNaira: envelope,
            inflation: 0,
            budgetGrowth: 0,
            revenueGrowth: 0,
            delivery: 80,
            maintenance: 10,
            scope: input.scope || "all",
            allocations,
            salariesNaira: salaries,
            debtServiceNaira: debt,
            committedMaintenanceNaira: upkeep,
            borrowingNaira: input.borrowing ?? 0,
            projectNaira: input.project ?? null,
            overrideProjectCap: input.overrideProjectCap === true,
          });
          const review = explainGuardrails(config, fundsFor(config.scope));
          const shown = describeNaira(envelope);
          const linkInput = { ...config, strategy: input.strategy || "balanced" };
          return remember(transcript, {
            allocated: true,
            blocked: Boolean(review.blocked),
            formula: input.percentages
              ? `Custom percentages of ${shown.short} after committed costs`
              : `${input.strategy || "balanced"} split of ${shown.short} after committed costs`,
            inputs: [
              {
                label: "Amount",
                display: shown.short,
                displayFull: shown.full,
                enteredByUser: Boolean(input.enteredByUser),
              },
            ],
            enteredByUser: Boolean(input.enteredByUser),
            source: input.enteredByUser ? "the amount you typed" : "the amount given",
            rows: review.blocked ? [] : sectorRows(allocations),
            warnings: review.warnings,
            assumptions: [GUARDRAILS.note],
            alternatives: review.alternatives || [],
            bestReason: review.bestReason || null,
            note: review.blocked || "This split is a preference, not a saved decision. Nothing is stored until you save it.",
            links: [{ href: planPageHref(linkInput), label: "Plan a budget" }],
            display: shown.short,
            displayFull: shown.full,
            resultNaira: envelope,
          });
        } catch (error) {
          return caught(transcript, error, "That allocation could not be checked.");
        }
      },
    }),
    runSimulation: tool({
      description:
        "Project a tax-collection change or a budget plan. Missing plan fields, including a partial sector list, use the strategy default and are labelled. The result is conditional and is not saved.",
      inputSchema: z.object({
        kind: z.enum(["tax", "plan", "scenarios"]),
        state: z.string().optional(),
        year: z.number().int().optional(),
        taxPercent: z.number().int().min(-50).max(50).optional(),
        plan: z.any().optional(),
      }),
      execute: async ({ kind, state, year, taxPercent, plan }) => {
        if (kind === "tax") return runTax(transcript, helpers, { state, year, taxPercent });
        try {
          const filled = fillPlan(plan || {});
          const config = validatePlan(filled.input);
          const context = getPlanningContext(config.scope);
          const result = projectPlan(config, context);
          const scenarios = kind === "scenarios" ? compareScenarios(config, context) : null;
          return remember(transcript, {
            projection: true,
            conditional: true,
            formula: result.formulas.join(" "),
            inputs: filled.assumptions.map((item) => ({ label: "Assumption", display: item, enteredByUser: false })),
            assumptions: filled.assumptions,
            scope: context.name,
            years: result.config.years,
            nominalNaira: result.totals.nominalNaira,
            constantPriceNaira: result.totals.constantPriceNaira,
            displayNominal: naira(result.totals.nominalNaira),
            displayConstant: naira(result.totals.constantPriceNaira),
            displayNominalExact: describeNaira(result.totals.nominalNaira).short,
            scenarios: scenarios?.map((item) => ({
              label: item.label,
              nominalNaira: item.result.totals.nominalNaira,
              displayNominal: naira(item.result.totals.nominalNaira),
            })),
            warnings: result.flags,
            alternatives: result.alternatives || [],
            bestReason: result.bestReason || null,
            sourceId: context.sourceId,
            inflationSourceId: filled.inflationSourceId,
            note: "This is a conditional plan, not a decision. Nothing is saved until you save it on the plan page.",
            warning: context.warning,
            links: [
              { href: scenarioPageHref({ ...config, strategy: plan?.strategy }), label: "Open in What-if tests" },
              ...(result.alternatives || []).filter((item) => item.href).map((item) => ({
                href: item.href,
                label: "Open in What-if tests",
              })),
            ],
          });
        } catch (error) {
          return caught(transcript, error, "The plan could not be checked.");
        }
      },
    }),
  };
}

function runTax(transcript, helpers, { state, year, taxPercent }) {
  const match = helpers.findState(state || "Lagos");
  let revenue;
  try {
    revenue = year == null ? getRevenue() : getRevenue(year);
  } catch (error) {
    return remember(transcript, {
      missing: true,
      year: year ?? null,
      note: error.status ? error.message : "That revenue year is not loaded.",
    });
  }
  const row = match && revenue.states.find((item) => item.id === match.id);
  if (!row || row.taxNaira == null) {
    return remember(transcript, {
      missing: true,
      state: state || "Lagos",
      year: year ?? null,
      note: "Published tax for that state and year is missing. Do not estimate it.",
    });
  }
  const stored = getDatabase()
    .prepare("select tax_kobo, other_kobo from state_revenue where state_id = ? and year = ?")
    .get(match.id, revenue.year);
  const illustrated = illustrateTax(stored.tax_kobo, stored.other_kobo, taxPercent ?? 0);
  return remember(transcript, {
    projection: true,
    conditional: true,
    formula: "Projected tax = published tax kobo × (100 + percent) / 100",
    inputs: [{ label: "Published tax", display: naira(row.taxNaira), enteredByUser: false }],
    state: row.name,
    year: revenue.year,
    taxPercent: taxPercent ?? 0,
    publishedTaxNaira: row.taxNaira,
    projectedTaxNaira: illustrated.taxKobo / 100,
    projectedIgrNaira: illustrated.totalKobo / 100,
    displayPublishedTax: naira(row.taxNaira),
    displayProjectedTax: naira(illustrated.taxKobo / 100),
    displayProjectedIgr: naira(illustrated.totalKobo / 100),
    ...helpers.sourceBrief(revenue.sourceId),
    note: illustrated.projection,
  });
}
