import type { DatabaseSync } from "node:sqlite";

export const LEDGER_TABLES = [
  "line_items",
  "projects",
  "priorities",
  "trajectory",
  "indicators",
  "snapshots",
  "revenue_sources",
  "faac",
  "jurisdictions",
] as const;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS jurisdictions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  population INTEGER
);
CREATE TABLE IF NOT EXISTS faac (
  fiscal_year INTEGER NOT NULL,
  jurisdiction_id TEXT NOT NULL,
  amount_million REAL NOT NULL,
  provenance TEXT NOT NULL,
  PRIMARY KEY (fiscal_year, jurisdiction_id)
);
CREATE TABLE IF NOT EXISTS revenue_sources (
  fiscal_year INTEGER NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount_million REAL NOT NULL,
  PRIMARY KEY (fiscal_year, id)
);
CREATE TABLE IF NOT EXISTS snapshots (
  fiscal_year INTEGER PRIMARY KEY,
  approved_naira REAL NOT NULL,
  statutory_naira REAL NOT NULL,
  recurrent_naira REAL NOT NULL,
  debt_naira REAL NOT NULL,
  capital_naira REAL NOT NULL,
  revenue_target_naira REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS indicators (
  fiscal_year INTEGER NOT NULL,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  period TEXT NOT NULL,
  bars TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (fiscal_year, title)
);
CREATE TABLE IF NOT EXISTS trajectory (
  fiscal_year INTEGER NOT NULL,
  quarter TEXT NOT NULL,
  collected REAL NOT NULL,
  target REAL NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (fiscal_year, quarter)
);
CREATE TABLE IF NOT EXISTS priorities (
  fiscal_year INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount_naira REAL NOT NULL,
  projects INTEGER NOT NULL,
  percent REAL NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (fiscal_year, name)
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  fiscal_year INTEGER NOT NULL,
  jurisdiction_id TEXT,
  name TEXT NOT NULL,
  agency TEXT NOT NULL,
  approved_naira REAL NOT NULL,
  progress INTEGER,
  expected TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS line_items (
  id INTEGER PRIMARY KEY,
  fiscal_year INTEGER NOT NULL,
  jurisdiction_id TEXT NOT NULL,
  lga TEXT NOT NULL,
  mda TEXT NOT NULL,
  sector TEXT NOT NULL,
  kind TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_naira REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  horizon INTEGER NOT NULL,
  strategy TEXT NOT NULL,
  assumptions TEXT NOT NULL,
  tradeoffs TEXT NOT NULL,
  budgets TEXT NOT NULL,
  revisions TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS line_items_lookup ON line_items (fiscal_year, lga, sector);
`;

export function applySchema(db: DatabaseSync): void {
  db.exec(SCHEMA_SQL);
}

export function recreateLedger(db: DatabaseSync): void {
  for (const table of LEDGER_TABLES) db.exec(`DROP TABLE IF EXISTS ${table}`);
  applySchema(db);
}
