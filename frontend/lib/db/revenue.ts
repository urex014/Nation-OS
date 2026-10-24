import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/connection";
import { round1, verticalSplit } from "@/lib/domain/formula";
import { STATES_TIER_MILLION } from "@/lib/db/seed/faac";
import type { Revenue } from "@/lib/types";

export function readRevenue(year: number): Revenue | null {
  return readRevenueFrom(getDb(), year);
}

export function readRevenueFrom(db: DatabaseSync, year: number): Revenue | null {
  const rows = db
    .prepare(
      `SELECT j.id, j.name, j.zone, j.population, f.amount_million, f.provenance
       FROM faac f
       JOIN jurisdictions j ON j.id = f.jurisdiction_id
       WHERE f.fiscal_year = ?
       ORDER BY f.amount_million DESC`,
    )
    .all(year) as {
    id: string;
    name: string;
    zone: string;
    population: number | null;
    amount_million: number;
    provenance: "published";
  }[];
  if (rows.length === 0) return null;
  const states = rows.reduce((sum, row) => sum + row.amount_million, 0);
  const raw = verticalSplit(states);
  const split = {
    pool: round1(raw.pool),
    federal: round1(raw.federal),
    states: round1(raw.states),
    local: 0,
  };
  split.local = round1(split.pool - split.federal - split.states);
  const sources = db
    .prepare(
      "SELECT id, name, amount_million FROM revenue_sources WHERE fiscal_year = ? ORDER BY amount_million DESC",
    )
    .all(year) as { id: string; name: string; amount_million: number }[];
  return {
    fiscalYear: year,
    distributablePool: round1(split.pool),
    tiers: {
      federal: round1(split.federal),
      states: round1(split.states),
      local: round1(split.local),
    },
    sources: sources.map((source) => ({
      id: source.id,
      name: source.name,
      amount: round1(source.amount_million),
    })),
    stateAllocations: rows.map((row) => ({
      id: row.id,
      name: row.name,
      population: row.population,
      sharePercent: round1((row.amount_million / STATES_TIER_MILLION) * 100),
      allocationAmount: row.amount_million,
      provenance: row.provenance,
      zone: row.zone,
    })),
  };
}

export function overheadStats(
  db: DatabaseSync,
  year: number,
): { overhead: number; mdas: number; capital: number } {
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
  const capital = db
    .prepare("SELECT capital_naira AS total FROM snapshots WHERE fiscal_year = ?")
    .get(year) as { total: number } | undefined;
  return { overhead: overhead.total, mdas: mdas.total, capital: capital?.total ?? 0 };
}
