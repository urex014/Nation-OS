import type { DatabaseSync } from "node:sqlite";
import { recreateLedger } from "@/lib/db/schema";
import { buildFaac } from "@/lib/db/seed/faac";
import { JURISDICTIONS } from "@/lib/db/seed/jurisdictions";
import { FISCAL_YEAR, INDICATORS, PROJECTS, RECEIPTS, SNAPSHOT } from "@/lib/db/seed/cited";
import { seedIntelligence } from "@/lib/db/seed/intelligence";

export const SEED_VERSION = "4";

export function seed(db: DatabaseSync): void {
  db.exec("BEGIN IMMEDIATE");
  const current = db.prepare("SELECT value FROM meta WHERE key = ?").get("seed_version") as
    { value: string } | undefined;
  if (current?.value === SEED_VERSION) {
    db.exec("COMMIT");
    return;
  }
  recreateLedger(db);
  const place = db.prepare(
    "INSERT INTO jurisdictions (id, name, zone, population) VALUES (?, ?, ?, ?)",
  );
  for (const row of JURISDICTIONS) place.run(row.id, row.name, row.zone, row.population);

  const faac = buildFaac(JURISDICTIONS);
  const insertFaac = db.prepare(
    "INSERT INTO faac (fiscal_year, jurisdiction_id, amount_million, provenance) VALUES (?, ?, ?, ?)",
  );
  for (const row of faac) insertFaac.run(FISCAL_YEAR, row.id, row.amountMillion, row.provenance);

  const insertSource = db.prepare(
    "INSERT INTO revenue_sources (fiscal_year, id, name, amount_million) VALUES (?, ?, ?, ?)",
  );
  for (const source of RECEIPTS) {
    insertSource.run(FISCAL_YEAR, source.id, source.name, source.amountMillion);
  }

  db.prepare(
    `INSERT INTO snapshots
      (fiscal_year, approved_naira, statutory_naira, recurrent_naira, debt_naira, capital_naira, revenue_target_naira)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    FISCAL_YEAR,
    SNAPSHOT.approvedNaira,
    SNAPSHOT.statutoryNaira,
    SNAPSHOT.recurrentNaira,
    SNAPSHOT.debtNaira,
    SNAPSHOT.capitalNaira,
    SNAPSHOT.revenueTargetNaira,
  );

  const insertIndicator = db.prepare(
    "INSERT INTO indicators (fiscal_year, title, value, period, bars, source) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const row of INDICATORS) {
    insertIndicator.run(
      FISCAL_YEAR,
      row.title,
      row.value,
      row.period,
      row.bars.join(","),
      row.source,
    );
  }

  const insertProject = db.prepare(
    `INSERT INTO projects
      (id, fiscal_year, jurisdiction_id, name, agency, approved_naira, progress, expected, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const row of PROJECTS) {
    insertProject.run(
      row.id,
      FISCAL_YEAR,
      row.jurisdictionId,
      row.name,
      row.agency,
      row.approvedNaira,
      null,
      row.expected,
      row.status,
    );
  }

  seedIntelligence(db);

  db.prepare(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run("seed_version", SEED_VERSION);
  db.exec("COMMIT");
}
