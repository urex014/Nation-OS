import { getDatabase, sourceDirectory, databasePath } from "../lib/nigeria/database.mjs";
import { importNigeriaData } from "../lib/nigeria/import-data.mjs";
import { applyRuntimeSchema, closeSql } from "../lib/runtime/postgres.ts";
// Re-importing observations never erases saved decisions or historical run snapshots.
importNigeriaData(getDatabase(), sourceDirectory());
console.log("Nigeria observations imported:", databasePath());
const shared = await applyRuntimeSchema();
console.log(
  shared
    ? "Postgres tables are ready (accounts, plans, decisions, audit)."
    : "No DATABASE_URL. Accounts and decisions stay on this computer.",
);
await closeSql();
