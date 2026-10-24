import { tool } from "ai";
import { z } from "zod";
import { createBudgetTools } from "./budget-tools.mjs";
import { createLedgerTools } from "./ledger-tools.mjs";
import { naira, indicatorValue } from "../nigeria/format.mjs";
import { getDatabase } from "../nigeria/database.mjs";
import { getIndicators, getJurisdictions, getRevenue, getSources } from "../nigeria/repository.mjs";

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

export function createTools(role, transcript = [], request = {}) {
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

  return {
    ...read,
    ...createBudgetTools(role, transcript, { findState, sourceBrief }),
    ...createLedgerTools(role, transcript, request),
  };
}

export function sourceIdsFrom(transcript) {
  return [...new Set(transcript.map((item) => item.sourceId).filter(Boolean))];
}
