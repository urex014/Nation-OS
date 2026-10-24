import fs from "node:fs";
import path from "node:path";
import { openReadOnlySqlite } from "../runtime/read-only-sqlite.mjs";
import { getPlanningContext } from "./repository.mjs";

function ledgerFile() {
  return process.env.NATION_DB_PATH ?? path.join(process.cwd(), "data", "nationos.sqlite");
}

/** Published FAAC for one state, when that ledger file is present. */
export function readFaacNaira(scope) {
  if (!scope || scope === "all") return null;
  const file = ledgerFile();
  if (!fs.existsSync(file)) return null;
  let db;
  try {
    db = openReadOnlySqlite(file);
    const row = db
      .prepare(
        "select fiscal_year as year, amount_million from faac where jurisdiction_id = ? order by fiscal_year desc limit 1",
      )
      .get(scope);
    if (!row || row.amount_million == null) return null;
    return { year: row.year, naira: Math.round(Number(row.amount_million) * 1_000_000) };
  } catch {
    return null;
  } finally {
    try {
      db?.close();
    } catch {
      /* already closed */
    }
  }
}

export function fundsFor(scope) {
  const context = getPlanningContext(scope);
  const faac = readFaacNaira(scope);
  return {
    scope,
    name: context.name,
    igrNaira: context.referenceRevenueNaira,
    igrYear: context.revenueYear,
    faacNaira: faac?.naira ?? null,
    faacYear: faac?.year ?? null,
    sourceId: context.sourceId,
  };
}
