import { prepareSourcedDatabase, databasePath } from "../lib/nigeria/database.mjs";
import { prepareLedger, ledgerPath } from "../lib/db/connection.ts";
import { applyRuntimeSchema, closeSql } from "../lib/runtime/postgres.ts";

prepareSourcedDatabase();
console.log("Published figures are ready:", databasePath());
prepareLedger();
console.log("Fiscal file is ready:", ledgerPath());
const shared = await applyRuntimeSchema();
console.log(
  shared
    ? "Postgres tables are ready (accounts, plans, decisions, audit)."
    : "No DATABASE_URL. Sign-up, plans, and decisions return 503 until DATABASE_URL or POSTGRES_URL is set.",
);
await closeSql();
