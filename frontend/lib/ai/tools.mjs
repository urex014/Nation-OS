import { tool } from "ai";
import { z } from "zod";
import { naira, indicatorValue } from "../nigeria/format.mjs";
import { illustrateTax } from "../nigeria/illustrate.mjs";
import { projectPlan, validatePlan } from "../nigeria/planning.mjs";
import { compareScenarios } from "../nigeria/scenarios.mjs";
import { getDatabase } from "../nigeria/database.mjs";
import {
  getIndicators,
  getJurisdictions,
  getPlanningContext,
  getRevenue,
  getSources,
} from "../nigeria/repository.mjs";

function findState(name) {
  const query = String(name || "")
    .trim()
    .toLowerCase();
  const states = getJurisdictions();
  if (query === "fct" || query === "abuja" || query === "federal capital territory") {
    return states.find((state) => state.id === "NG-FC") ?? null;
  }
  return (
    states.find(
      (state) => state.name.toLowerCase() === query || state.id.toLowerCase() === query,
    ) ?? null
  );
}

function sourceBrief(id) {
  const source = getSources().find((item) => item.id === id);
  if (!source) return { sourceId: id };
  return {
    sourceId: source.id,
    publisher: source.publisher,
    title: source.title,
    period: source.period,
    note: source.note,
  };
}

function remember(transcript, result) {
  transcript.push(result);
  return result;
}

export function createTools(role, transcript = []) {
  const read = {
    getNationalIndicators: tool({
      description: "Read a published national indicator for Nigeria. Never copy it onto one state.",
      inputSchema: z.object({
        code: z
          .string()
          .optional()
          .describe("Indicator code such as FP.CPI.TOTL.ZG. Omit for all."),
      }),
      execute: async ({ code }) => {
        const rows = getIndicators().filter((item) => !code || item.code === code);
        return remember(transcript, {
          ...sourceBrief("worldbank-wdi-ng"),
          indicators: rows.map((item) => ({
            code: item.code,
            label: item.label,
            year: item.year,
            value: item.value,
            display: indicatorValue(item),
            unit: item.unit,
            note: item.note,
            missing: item.value == null,
          })),
        });
      },
    }),
    getStateRevenue: tool({
      description: "Read published internally generated revenue for one state and year.",
      inputSchema: z.object({
        state: z.string(),
        year: z.number().int().optional(),
      }),
      execute: async ({ state, year }) => {
        const match = findState(state);
        if (!match) {
          return remember(transcript, {
            missing: true,
            state,
            year: year ?? null,
            note: "That state is not in the imported list.",
          });
        }
        let revenue;
        try {
          revenue = year == null ? getRevenue() : getRevenue(year);
        } catch (error) {
          return remember(transcript, {
            missing: true,
            state: match.name,
            year: year ?? null,
            note: error.status ? error.message : "That revenue year is not loaded.",
          });
        }
        const row = revenue.states.find((item) => item.id === match.id);
        if (!row) {
          return remember(transcript, {
            missing: true,
            state: match.name,
            year,
            ...sourceBrief(revenue.sourceId),
            note: "No observation for that year. Do not estimate one.",
          });
        }
        return remember(transcript, {
          state: row.name,
          year: revenue.year,
          totalNaira: row.totalNaira,
          taxNaira: row.taxNaira,
          otherNaira: row.otherNaira,
          rank: row.rank,
          coverage: revenue.coverage,
          displayTotal: naira(row.totalNaira),
          displayTax: naira(row.taxNaira),
          displayOther: naira(row.otherNaira),
          ...sourceBrief(revenue.sourceId),
          note: revenue.note,
        });
      },
    }),
    compareStates: tool({
      description: "Compare published IGR for two states in one year. Nominal only.",
      inputSchema: z.object({
        first: z.string(),
        second: z.string(),
        year: z.number().int().optional(),
      }),
      execute: async ({ first, second, year }) => {
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
        const rows = [first, second].map((name) => {
          const match = findState(name);
          const row = match && revenue.states.find((item) => item.id === match.id);
          return row
            ? {
                state: row.name,
                totalNaira: row.totalNaira,
                displayTotal: naira(row.totalNaira),
                rank: row.rank,
              }
            : { state: name, missing: true };
        });
        return remember(transcript, {
          year: revenue.year,
          rows,
          ...sourceBrief(revenue.sourceId),
          note: revenue.note,
        });
      },
    }),
    getFederalBudget: tool({
      description: "Read the imported federal budget headline. It is not a state budget.",
      inputSchema: z.object({}),
      execute: async () => {
        const budget = getDatabase()
          .prepare(
            "select year, approved_naira, source_id from federal_budgets order by year desc limit 1",
          )
          .get();
        if (!budget) {
          return remember(transcript, {
            missing: true,
            note: "No federal budget headline is loaded.",
          });
        }
        return remember(transcript, {
          year: budget.year,
          approvedNaira: budget.approved_naira,
          displayApproved: naira(budget.approved_naira),
          ...sourceBrief(budget.source_id),
          note: "Approved federal headline. Not Lagos spending and not actual expenditure.",
        });
      },
    }),
  };

  if (role !== "government") return read;

  return {
    ...read,
    runSimulation: tool({
      description:
        "Project a tax-collection change or a validated investment plan. The result is conditional, not a decision.",
      inputSchema: z.object({
        kind: z.enum(["tax", "plan", "scenarios"]),
        state: z.string().optional(),
        year: z.number().int().optional(),
        taxPercent: z.number().int().min(-50).max(50).optional(),
        plan: z.any().optional(),
      }),
      execute: async ({ kind, state, year, taxPercent, plan }) => {
        if (kind === "tax") {
          const match = findState(state || "Lagos");
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
            .prepare(
              "select tax_kobo, other_kobo from state_revenue where state_id = ? and year = ?",
            )
            .get(match.id, revenue.year);
          const illustrated = illustrateTax(stored.tax_kobo, stored.other_kobo, taxPercent ?? 0);
          return remember(transcript, {
            projection: true,
            conditional: true,
            state: row.name,
            year: revenue.year,
            taxPercent: taxPercent ?? 0,
            publishedTaxNaira: row.taxNaira,
            projectedTaxNaira: illustrated.taxKobo / 100,
            projectedIgrNaira: illustrated.totalKobo / 100,
            displayPublishedTax: naira(row.taxNaira),
            displayProjectedTax: naira(illustrated.taxKobo / 100),
            displayProjectedIgr: naira(illustrated.totalKobo / 100),
            ...sourceBrief(revenue.sourceId),
            note: illustrated.projection,
          });
        }
        try {
          const config = validatePlan(plan);
          const context = getPlanningContext(config.scope);
          const result = projectPlan(config, context);
          const scenarios = kind === "scenarios" ? compareScenarios(config, context) : null;
          return remember(transcript, {
            projection: true,
            conditional: true,
            scope: context.name,
            years: result.config.years,
            nominalNaira: result.totals.nominalNaira,
            constantPriceNaira: result.totals.constantPriceNaira,
            displayNominal: naira(result.totals.nominalNaira),
            displayConstant: naira(result.totals.constantPriceNaira),
            scenarios: scenarios?.map((item) => ({
              label: item.label,
              nominalNaira: item.result.totals.nominalNaira,
              displayNominal: naira(item.result.totals.nominalNaira),
            })),
            ...sourceBrief(context.sourceId),
            note: result.limitations[0],
            warning: context.warning,
          });
        } catch (error) {
          return remember(transcript, {
            missing: true,
            note: error.status ? error.message : "The plan could not be checked.",
          });
        }
      },
    }),
  };
}

export function sourceIdsFrom(transcript) {
  return [...new Set(transcript.map((item) => item.sourceId).filter(Boolean))];
}
