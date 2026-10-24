import type { DatabaseSync } from "node:sqlite";
import { getDb } from "@/lib/db/connection";
import { round1 } from "@/lib/domain/formula";
import { formatNaira } from "@/lib/format/money";
import { STATES_TIER_MILLION } from "@/lib/db/seed/faac";
import type { Overview } from "@/lib/types";

type Snapshot = {
  approved_naira: number;
  statutory_naira: number;
  recurrent_naira: number;
  debt_naira: number;
  capital_naira: number;
  revenue_target_naira: number;
};

export function readOverview(year: number, jurisdictionId: string): Overview | null {
  return readOverviewFrom(getDb(), year, jurisdictionId);
}

export function readOverviewFrom(
  db: DatabaseSync,
  year: number,
  jurisdictionId: string,
): Overview | null {
  const snapshot = db.prepare("SELECT * FROM snapshots WHERE fiscal_year = ?").get(year) as
    Snapshot | undefined;
  if (!snapshot) return null;

  const faacRows = db
    .prepare(
      `SELECT j.id, j.name, j.zone, f.amount_million, f.provenance
       FROM jurisdictions j
       LEFT JOIN faac f ON f.jurisdiction_id = j.id AND f.fiscal_year = ?
       ORDER BY j.zone, j.name`,
    )
    .all(year) as {
    id: string;
    name: string;
    zone: string;
    amount_million: number | null;
    provenance: string | null;
  }[];

  let ratio = 1;
  let jurisdictionName: string | null = null;
  let note: string | null = null;
  if (jurisdictionId !== "all") {
    const selected = faacRows.find((row) => row.id === jurisdictionId);
    if (!selected) return null;
    jurisdictionName = selected.name;
    if (selected.amount_million == null) {
      note = `${selected.name} is not in the January–September 2026 36-state FAAC table. National envelopes stay in place.`;
    } else {
      ratio = selected.amount_million / STATES_TIER_MILLION;
      note = `${selected.name} is shown as its ${round1(ratio * 100)}% share of the 36-state FAAC pool, applied to the national envelopes.`;
    }
  }

  const indicators = (
    db
      .prepare("SELECT title, value, period, bars, source FROM indicators WHERE fiscal_year = ?")
      .all(year) as {
      title: string;
      value: string;
      period: string;
      bars: string;
      source: string;
    }[]
  ).map((row) => ({
    title: row.title,
    value: row.value,
    period: row.period,
    bars: row.bars.length === 0 ? [] : row.bars.split(",").map(Number),
    source: row.source,
  }));

  const trajectory = db
    .prepare(
      "SELECT quarter, collected, target FROM trajectory WHERE fiscal_year = ? ORDER BY position",
    )
    .all(year) as { quarter: string; collected: number; target: number }[];

  const priorities = (
    db
      .prepare(
        "SELECT name, amount_naira, projects, percent FROM priorities WHERE fiscal_year = ? ORDER BY position",
      )
      .all(year) as { name: string; amount_naira: number; projects: number; percent: number }[]
  ).map((row) => ({
    name: row.name,
    amount: formatNaira(row.amount_naira * ratio),
    projects: row.projects,
    percent: row.percent,
  }));

  const projectSql =
    jurisdictionId === "all"
      ? "SELECT * FROM projects WHERE fiscal_year = ? ORDER BY approved_naira DESC"
      : "SELECT * FROM projects WHERE fiscal_year = ? AND jurisdiction_id = ? ORDER BY approved_naira DESC";
  const projectRows = (
    jurisdictionId === "all"
      ? db.prepare(projectSql).all(year)
      : db.prepare(projectSql).all(year, jurisdictionId)
  ) as {
    id: string;
    name: string;
    agency: string;
    approved_naira: number;
    progress: number | null;
    expected: string;
    status: string;
  }[];

  return {
    fiscalYear: year,
    currency: "NGN",
    unit: "million",
    jurisdictionId,
    jurisdictionName,
    note,
    metrics: {
      approvedExpenditure: formatNaira(snapshot.approved_naira * ratio),
      statutoryTransfers: formatNaira(snapshot.statutory_naira * ratio),
      recurrentNonDebt: formatNaira(snapshot.recurrent_naira * ratio),
      debtService: formatNaira(snapshot.debt_naira * ratio),
      capitalExpenditure: formatNaira(snapshot.capital_naira * ratio),
      revenueTarget: formatNaira(snapshot.revenue_target_naira * ratio),
    },
    indicators,
    revenueTrajectory: {
      quarters: trajectory.map((row) => row.quarter),
      collected: trajectory.map((row) => round1(row.collected * ratio)),
      target: trajectory.map((row) => round1(row.target * ratio)),
    },
    priorities,
    projects: projectRows.map((row) => ({
      id: row.id,
      name: row.name,
      agency: row.agency,
      approved: formatNaira(row.approved_naira),
      progress: row.progress,
      expected: row.expected,
      status: row.status,
    })),
    jurisdictions: faacRows.map((row) => ({
      id: row.id,
      name: row.name,
      zone: row.zone,
      sharePercent:
        row.amount_million == null ? 0 : round1((row.amount_million / STATES_TIER_MILLION) * 100),
      provenance: (row.provenance ?? "outside") as Overview["jurisdictions"][number]["provenance"],
    })),
  };
}
