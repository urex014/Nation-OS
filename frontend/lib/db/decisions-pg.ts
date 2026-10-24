import { ensureRuntimeSchema, getSql } from "@/lib/runtime/postgres";
import type { DecisionRecord } from "@/lib/types";

type StoredDecision = {
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

function mapDecision(row: StoredDecision): DecisionRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    title: row.title,
    question: row.question,
    horizon: Number(row.horizon),
    strategy: row.strategy,
    assumptions: JSON.parse(row.assumptions) as string[],
    tradeoffs: JSON.parse(row.tradeoffs) as string[],
    budgets: JSON.parse(row.budgets) as Record<string, number>,
    revisions: JSON.parse(row.revisions) as DecisionRecord["revisions"],
  };
}

export async function listLedgerDecisions(): Promise<DecisionRecord[]> {
  await ensureRuntimeSchema();
  const sql = getSql();
  const rows = (await sql`
    select id, created_at, title, question, horizon, strategy, assumptions, tradeoffs, budgets, revisions
    from ledger_decisions
    order by created_at desc
  `) as unknown as StoredDecision[];
  return rows.map(mapDecision);
}

export async function latestLedgerDecision(): Promise<StoredDecision | null> {
  await ensureRuntimeSchema();
  const sql = getSql();
  const rows = (await sql`
    select id, created_at, title, question, horizon, strategy, assumptions, tradeoffs, budgets, revisions
    from ledger_decisions
    order by created_at desc
    limit 1
  `) as unknown as StoredDecision[];
  return rows[0] ?? null;
}

export async function insertLedgerDecision(record: DecisionRecord): Promise<void> {
  await ensureRuntimeSchema();
  await getSql()`
    insert into ledger_decisions
      (id, created_at, title, question, horizon, strategy, assumptions, tradeoffs, budgets, revisions)
    values (
      ${record.id},
      ${record.createdAt},
      ${record.title},
      ${record.question},
      ${record.horizon},
      ${record.strategy},
      ${JSON.stringify(record.assumptions)},
      ${JSON.stringify(record.tradeoffs)},
      ${JSON.stringify(record.budgets)},
      ${JSON.stringify(record.revisions)}
    )
  `;
}
