import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/connection";
import type { Recommendation } from "@/lib/domain/recommend";
import type { RecommendInput } from "@/lib/domain/recommend";
import { databaseUrl } from "@/lib/runtime/database-url";
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
  if (databaseUrl()) {
    const { listLedgerDecisions } = await import("@/lib/db/decisions-pg");
    return listLedgerDecisions();
  }
  return listDecisionsFrom(getDb());
}

export function listDecisionsFrom(db: DatabaseSync): DecisionRecord[] {
  const rows = db
    .prepare("SELECT * FROM decisions ORDER BY created_at DESC")
    .all() as DecisionRow[];
  return rows.map(mapDecision);
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
  if (!databaseUrl()) return saveDecisionOn(getDb(), input, result);
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

export function saveDecisionOn(
  db: DatabaseSync,
  input: RecommendInput,
  result: Recommendation,
): DecisionRecord {
  const previous = db.prepare("SELECT * FROM decisions ORDER BY created_at DESC LIMIT 1").get() as
    DecisionRow | undefined;
  const record = composeDecision(input, result, previous);
  db.prepare(
    `INSERT INTO decisions
      (id, created_at, title, question, horizon, strategy, assumptions, tradeoffs, budgets, revisions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.createdAt,
    record.title,
    record.question,
    record.horizon,
    record.strategy,
    JSON.stringify(record.assumptions),
    JSON.stringify(record.tradeoffs),
    JSON.stringify(record.budgets),
    JSON.stringify(record.revisions),
  );
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

function mapDecision(row: DecisionRow): DecisionRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    title: row.title,
    question: row.question,
    horizon: row.horizon,
    strategy: row.strategy,
    assumptions: JSON.parse(row.assumptions) as string[],
    tradeoffs: JSON.parse(row.tradeoffs) as string[],
    budgets: JSON.parse(row.budgets) as Record<string, number>,
    revisions: JSON.parse(row.revisions) as DecisionRecord["revisions"],
  };
}
