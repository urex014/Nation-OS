import { randomUUID } from "node:crypto";
import type { Recommendation } from "@/lib/domain/recommend";
import type { RecommendInput } from "@/lib/domain/recommend";
import { DATABASE_REQUIRED, databaseUrl } from "@/lib/runtime/database-url";
import type { DecisionRecord } from "@/lib/types";

type DecisionRow = {
  id: string;
  created_at: string;
  title: string;
  question: string;
  horizon: number;
  strategy: string;
  assumptions: string;
  tradeoffs: string;
  budgets: string;
  revisions: string;
};

export async function listDecisions(): Promise<DecisionRecord[]> {
  if (!databaseUrl()) throw Object.assign(new Error(DATABASE_REQUIRED), { status: 503 });
  const { listLedgerDecisions } = await import("@/lib/db/decisions-pg");
  return listLedgerDecisions();
}

function decisionTitle(strategy: string): string {
  if (strategy === "needs") return "Needs split";
  if (strategy === "growth") return "Growth split";
  if (strategy === "balance") return "Balance split";
  return "Budget split";
}

export async function saveDecision(
  input: RecommendInput,
  result: Recommendation,
): Promise<DecisionRecord> {
  if (!databaseUrl()) throw Object.assign(new Error(DATABASE_REQUIRED), { status: 503 });
  const { insertLedgerDecision, latestLedgerDecision } = await import("@/lib/db/decisions-pg");
  const previous = await latestLedgerDecision();
  const record = composeDecision(
    input,
    result,
    previous ? { ...previous, horizon: Number(previous.horizon) } : undefined,
  );
  await insertLedgerDecision(record);
  return record;
}

function composeDecision(
  input: RecommendInput,
  result: Recommendation,
  previous?: DecisionRow,
): DecisionRecord {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    title: decisionTitle(input.strategy),
    question: input.question,
    horizon: input.horizon,
    strategy: input.strategy,
    assumptions: [
      "The sector amounts add up to the budget.",
      "Inflation comes from the stored figure, not a forecast.",
      "Money already spent on capital projects stays out of this budget.",
    ],
    tradeoffs: result.tradeoffs,
    budgets: result.budgets,
    revisions: previous ? diffDecision(previous, input, result.budgets) : [],
  };
}

function diffDecision(
  previous: DecisionRow,
  input: RecommendInput,
  budgets: Record<string, number>,
): DecisionRecord["revisions"] {
  const revisions: DecisionRecord["revisions"] = [];
  if (previous.strategy !== input.strategy) {
    revisions.push({ field: "strategy", before: previous.strategy, after: input.strategy });
  }
  if (previous.horizon !== input.horizon) {
    revisions.push({
      field: "horizon",
      before: String(previous.horizon),
      after: String(input.horizon),
    });
  }
  const before = JSON.parse(previous.budgets) as Record<string, number>;
  for (const key of Object.keys(budgets)) {
    if (before[key] !== budgets[key]) {
      revisions.push({
        field: key,
        before: String(before[key] ?? "none"),
        after: String(budgets[key]),
      });
    }
  }
  return revisions;
}
