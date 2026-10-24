import { tool } from "ai";
import { z } from "zod";
import { fiscalSnapshot, listBudgets, listFaac } from "../nigeria/ledger-read.mjs";
import { checkProjectRequest } from "../nigeria/project-check.mjs";

function remember(transcript, result) {
  transcript.push(result);
  return result;
}

export function createLedgerTools(role, transcript, request = {}) {
  const read = {
    getBudget: tool({
      description:
        "Read every loaded budget and its source. Includes the 2026 signed federal total, the 2026 third-reading total with statutory, recurrent, debt and capital components, and the approved federal headline. Call this before naming a budget figure.",
      inputSchema: z.object({
        year: z.number().int().optional(),
        level: z.string().optional(),
      }),
      execute: async ({ year, level }) => {
        let budgets = listBudgets();
        if (year) budgets = budgets.filter((row) => row.year === year);
        if (level) {
          const name = level.toLowerCase();
          budgets = budgets.filter((row) => row.level === name || row.kind === name);
        }
        return remember(transcript, {
          budgets,
          note: "The signed 2026 total is the citation figure. The third reading is the stored snapshot and its components. Neither figure is an agency budget.",
        });
      },
    }),
    getFaac: tool({
      description: "Read FAAC allocations from the cited ledger, including the Jan–Sep 2026 headline and per-state amounts.",
      inputSchema: z.object({ year: z.number().int().optional() }),
      execute: async ({ year }) => remember(transcript, { faac: true, ...listFaac(year) }),
    }),
    getFiscalSnapshot: tool({
      description:
        "Read the cited fiscal snapshot: signed and third-reading totals, capital, debt, inflation, GDP and the 2026 project lines, each with its source.",
      inputSchema: z.object({ year: z.number().int().optional() }),
      execute: async ({ year }) => remember(transcript, { snapshot: true, ...fiscalSnapshot(year) }),
    }),
  };
  if (role !== "government") return read;
  return {
    ...read,
    checkProject: tool({
      description:
        "Check one project amount against a budget. Do not pass your own numbers. The tool reads the person's question, earlier turns and page settings, and it names any assumed budget.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = checkProjectRequest({
          message: request.message || "",
          context: request.context,
          history: request.history,
          page: request.page,
          role,
        });
        return remember(
          transcript,
          result || { missing: true, note: "That message is not a single-project check." },
        );
      },
    }),
  };
}
