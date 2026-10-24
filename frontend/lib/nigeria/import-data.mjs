/** Import a source snapshot transactionally. Refreshes never delete saved plans or audit history. */
import { readFileSync } from "node:fs";
import path from "node:path";

export function importNigeriaData(db, directory) {
  const json = (name) => JSON.parse(readFileSync(path.join(directory, name), "utf8"));
  const lines = (name) =>
    readFileSync(path.join(directory, name), "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));
  const sources = json("sources.json"),
    states = lines("states.ndjson");
  const revenue = lines("revenue.ndjson"),
    indicators = lines("indicators.ndjson");
  if (states.length !== 37 || revenue.length !== 259 || sources.length !== 4)
    throw Error("Unexpected Nigeria dataset coverage. Run data validation before import.");
  const budget = json("federal-budget.json");
  db.exec("begin immediate");
  try {
    const sourceInsert = db.prepare(
      "insert into sources values (?,?) on conflict(id) do update set metadata_json=excluded.metadata_json",
    );
    for (const source of sources) sourceInsert.run(source.id, JSON.stringify(source));
    const stateInsert = db.prepare(
      "insert into jurisdictions values (?,?,?,?,?) on conflict(id) do update set name=excluded.name,type=excluded.type,geometry_json=excluded.geometry_json,source_id=excluded.source_id",
    );
    for (const state of states)
      stateInsert.run(
        state.id,
        state.name,
        state.type,
        JSON.stringify(state.geometry),
        state.sourceId,
      );
    const indicatorInsert = db.prepare(
      "insert into indicators values (?,?,?,?,?) on conflict(code,year) do update set name=excluded.name,value=excluded.value,source_id=excluded.source_id",
    );
    for (const row of indicators)
      indicatorInsert.run(row.code, row.year, row.name, row.value, row.sourceId);
    const revenueInsert = db.prepare(`insert into state_revenue values (?,?,?,?,?,?,?,?,?,?)
      on conflict(state_id,year) do update set total_kobo=excluded.total_kobo,tax_kobo=excluded.tax_kobo,
      other_kobo=excluded.other_kobo,other_label=excluded.other_label,components_json=excluded.components_json,
      reconciliation_kobo=excluded.reconciliation_kobo,source_name=excluded.source_name,source_id=excluded.source_id`);
    for (const row of revenue) {
      if (!Number.isSafeInteger(row.totalKobo)) throw Error("Unsafe source money value.");
      revenueInsert.run(
        row.stateId,
        row.year,
        row.totalKobo,
        row.taxKobo,
        row.otherKobo,
        row.otherLabel,
        JSON.stringify(row.components),
        row.reconciliationKobo,
        row.sourceName,
        row.sourceId,
      );
    }
    db.prepare(
      "insert into federal_budgets values (?,?,?,?) on conflict(year) do update set approved_naira=excluded.approved_naira,metadata_json=excluded.metadata_json,source_id=excluded.source_id",
    ).run(budget.year, budget.approvedNaira, JSON.stringify(budget), budget.sourceId);
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
  return {
    jurisdictions: states.length,
    stateYearRevenueRows: revenue.length,
    indicatorRows: indicators.length,
    sources: sources.length,
  };
}
