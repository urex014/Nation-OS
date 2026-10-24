import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/connection";
import { answerLedger, type LedgerRow } from "@/lib/domain/chat";
import {
  recommend,
  type RecommendInput,
  type Recommendation,
  type Strategy,
} from "@/lib/domain/recommend";
import { GDP_GROWTH, SNAPSHOT } from "@/lib/db/seed/cited";

const STRATEGIES = new Set<Strategy>(["needs", "growth", "balance"]);

export function ledgerAnswer(query: string, year = 2026): string {
  return ledgerAnswerFrom(getDb(), query, year);
}

export function ledgerAnswerFrom(db: DatabaseSync, query: string, year: number): string {
  const rows = db
    .prepare(
      "SELECT lga, mda, sector, kind, amount_naira AS amountNaira FROM line_items WHERE fiscal_year = ?",
    )
    .all(year) as LedgerRow[];
  return answerLedger(query, rows);
}

export function buildRecommendation(input: RecommendInput): Recommendation {
  const db = getDb();
  const inflation = db
    .prepare("SELECT value FROM indicators WHERE fiscal_year = ? AND title = ?")
    .get(2026, "Inflation") as { value: string } | undefined;
  const places = db.prepare("SELECT COUNT(*) AS total FROM jurisdictions").get() as {
    total: number;
  };
  return recommend(input, inflation?.value ?? "15.06%", places.total);
}

export function parseRecommend(body: unknown): RecommendInput | string {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Send a JSON object.";
  const record = body as Record<string, unknown>;
  const question = record.question;
  const budget = record.budget;
  const horizon = record.horizon;
  const strategy = record.strategy;
  if (typeof question !== "string" || question.trim().length < 8 || question.length > 500) {
    return "Question must be 8 to 500 characters.";
  }
  if (
    typeof budget !== "number" ||
    !Number.isSafeInteger(budget) ||
    budget < 1 ||
    budget > 1_000_000_000
  ) {
    return "Budget must be a whole number from 1 to 1000000000. The unit is million naira.";
  }
  if (
    typeof horizon !== "number" ||
    !Number.isSafeInteger(horizon) ||
    horizon < 1 ||
    horizon > 30
  ) {
    return "Horizon must be a whole number from 1 to 30.";
  }
  if (typeof strategy !== "string" || !STRATEGIES.has(strategy as Strategy)) {
    return "Strategy must be needs, growth, or balance.";
  }
  return { question: question.trim(), budget, horizon, strategy: strategy as Strategy };
}

export function scenarioInputs(year = 2026): {
  baseRevenue: number;
  capital: number;
  overhead: number;
  growth: number;
  mdas: number;
} {
  const db = getDb();
  const snapshot = db
    .prepare("SELECT revenue_target_naira, capital_naira FROM snapshots WHERE fiscal_year = ?")
    .get(year) as { revenue_target_naira: number; capital_naira: number } | undefined;
  const overhead = db
    .prepare(
      "SELECT COALESCE(SUM(amount_naira), 0) AS total FROM line_items WHERE fiscal_year = ? AND category = 'overhead'",
    )
    .get(year) as { total: number };
  const mdas = db
    .prepare(
      "SELECT COUNT(DISTINCT mda) AS total FROM line_items WHERE fiscal_year = ? AND category = 'overhead'",
    )
    .get(year) as { total: number };
  return {
    baseRevenue: snapshot?.revenue_target_naira ?? SNAPSHOT.revenueTargetNaira,
    capital: snapshot?.capital_naira ?? SNAPSHOT.capitalNaira,
    overhead: overhead.total,
    growth: GDP_GROWTH,
    mdas: mdas.total,
  };
}
