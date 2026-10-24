import fs from "node:fs";
import path from "node:path";
import { openReadOnlySqlite } from "../runtime/read-only-sqlite.mjs";
import { getDatabase } from "./database.mjs";
import { getSources } from "./repository.mjs";
import { describeNaira } from "./money.mjs";

function citedFile() {
  const candidates = [
    path.join(process.cwd(), "data", "cited", "ledger.json"),
    path.join(process.cwd(), "frontend", "data", "cited", "ledger.json"),
  ];
  return candidates.find((file) => fs.existsSync(file)) || candidates[0];
}

function cited() {
  return JSON.parse(fs.readFileSync(citedFile(), "utf8"));
}

function trillionNaira(value) {
  const [whole, frac = ""] = String(value).split(".");
  const digits = `${whole}${frac}`;
  const scale = 10n ** BigInt(frac.length);
  return Number((BigInt(digits) * 10n ** 12n) / scale);
}

function ledgerFile() {
  const preferred = process.env.NATION_DB_PATH;
  if (preferred && fs.existsSync(preferred)) return preferred;
  const bundled = path.join(process.cwd(), "data", "nationos.sqlite");
  return fs.existsSync(bundled) ? bundled : null;
}

function withLedger(read) {
  const file = ledgerFile();
  if (!file) return null;
  let db;
  try {
    db = openReadOnlySqlite(file);
    return read(db);
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

function dateLabel(iso) {
  const [year, month, day] = String(iso || "").split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!year || !month || !day) return iso || "";
  return `${Number(day)} ${names[Number(month) - 1]} ${year}`;
}

function pack(row) {
  return { ...row, display: describeNaira(row.naira).short, displayFull: describeNaira(row.naira).full };
}

/** Every loaded budget the chat can name, with its source. Signed 2026 is the citation, not the third-reading total. */
export function listBudgets() {
  const book = cited();
  const signing = book.citations.budgetSigning;
  const reading = book.citations.budgetThirdReading;
  const rows = [
    pack({
      year: book.fiscalYear,
      level: "federal",
      kind: "signed",
      label: "federal budget",
      naira: trillionNaira(68.32),
      source: {
        publisher: signing.publisher,
        title: signing.title,
        date: signing.date,
        dateLabel: dateLabel(signing.date),
        url: signing.url,
        note: signing.note,
      },
    }),
  ];
  const snapshot = withLedger((db) =>
    db.prepare("select * from snapshots order by fiscal_year desc limit 1").get(),
  );
  if (snapshot) {
    rows.push(
      pack({
        year: snapshot.fiscal_year,
        level: "federal",
        kind: "third-reading",
        label: "federal budget (third reading)",
        naira: Math.round(snapshot.approved_naira),
        statutoryNaira: Math.round(snapshot.statutory_naira),
        recurrentNaira: Math.round(snapshot.recurrent_naira),
        debtNaira: Math.round(snapshot.debt_naira),
        capitalNaira: Math.round(snapshot.capital_naira),
        revenueTargetNaira: Math.round(snapshot.revenue_target_naira),
        source: {
          publisher: reading.publisher,
          title: reading.title,
          date: reading.date,
          dateLabel: dateLabel(reading.date),
          url: reading.url,
          note: reading.note,
        },
      }),
    );
    if (snapshot.capital_naira) {
      rows.push(
        pack({
          year: snapshot.fiscal_year,
          level: "federal",
          kind: "capital",
          label: "federal capital line",
          naira: Math.round(snapshot.capital_naira),
          source: {
            publisher: reading.publisher,
            title: reading.title,
            date: reading.date,
            dateLabel: dateLabel(reading.date),
            url: reading.url,
            note: "Capital component of the 2026 third-reading budget. Not the signed total.",
          },
        }),
      );
    }
  }
  try {
    const row = getDatabase()
      .prepare("select year, approved_naira, source_id from federal_budgets order by year desc limit 1")
      .get();
    const source = getSources().find((item) => item.id === row?.source_id);
    if (row) {
      rows.push(
        pack({
          year: row.year,
          level: "federal",
          kind: "approved",
          label: "federal budget",
          naira: row.approved_naira,
          source: {
            id: row.source_id,
            publisher: source?.publisher || "Federal Government",
            title: source?.title || "Approved federal budget",
            date: String(row.year),
            dateLabel: String(row.year),
            url: source?.url || "",
            note: source?.note || "Approved federal headline. Not a state or agency budget.",
          },
        }),
      );
    }
  } catch {
    /* nigeria database not open */
  }
  return rows;
}

export function listFaac(year) {
  const book = cited();
  const citation = book.citations[book.faac.citation];
  const rows = withLedger((db) => {
    const sql = year
      ? "select fiscal_year, jurisdiction_id, amount_million from faac where fiscal_year = ? order by amount_million desc"
      : "select fiscal_year, jurisdiction_id, amount_million from faac order by fiscal_year desc, amount_million desc";
    return year ? db.prepare(sql).all(year) : db.prepare(sql).all();
  });
  return {
    period: book.faac.period,
    headlineTrillion: book.faac.headlineTrillion,
    source: citation
      ? { publisher: citation.publisher, title: citation.title, date: citation.date, dateLabel: dateLabel(citation.date), url: citation.url, note: citation.note }
      : null,
    rows: (rows || []).map((row) => ({
      year: row.fiscal_year,
      id: row.jurisdiction_id,
      million: row.amount_million,
      naira: Math.round(row.amount_million * 1_000_000),
    })),
  };
}

export function fiscalSnapshot(year) {
  const book = cited();
  const snapshot = withLedger((db) => {
    const row = year
      ? db.prepare("select * from snapshots where fiscal_year = ?").get(year)
      : db.prepare("select * from snapshots order by fiscal_year desc limit 1").get();
    if (!row) return null;
    const indicators = db.prepare("select title, value, period, source from indicators where fiscal_year = ?").all(row.fiscal_year);
    const projects = db
      .prepare("select id, name, agency, approved_naira, status from projects where fiscal_year = ?")
      .all(row.fiscal_year);
    return { row, indicators, projects };
  });
  return {
    year: snapshot?.row?.fiscal_year || book.fiscalYear,
    signedNaira: trillionNaira(68.32),
    thirdReadingNaira: snapshot ? Math.round(snapshot.row.approved_naira) : trillionNaira(book.snapshot.approvedTrillion),
    capitalNaira: snapshot ? Math.round(snapshot.row.capital_naira) : trillionNaira(book.snapshot.capitalTrillion),
    debtNaira: snapshot ? Math.round(snapshot.row.debt_naira) : trillionNaira(book.snapshot.debtServiceTrillion),
    indicators: snapshot?.indicators || book.indicators,
    projects: (snapshot?.projects || []).map((item) => ({ ...item, approvedNaira: Math.round(item.approved_naira) })),
    citations: Object.entries(book.citations).map(([id, item]) => ({
      id,
      publisher: item.publisher,
      title: item.title,
      date: item.date,
      url: item.url,
    })),
  };
}
