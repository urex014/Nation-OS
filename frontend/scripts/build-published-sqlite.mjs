import { DatabaseSync } from "node:sqlite";
import { databasePath, prepareSourcedDatabase } from "../lib/nigeria/database.mjs";
import { ledgerPath, prepareLedger } from "../lib/db/connection.ts";

prepareSourcedDatabase();
console.log("Published figures are ready:", databasePath());
prepareLedger();
console.log("Fiscal file is ready:", ledgerPath());

const db = new DatabaseSync(ledgerPath(), { readOnly: true });
const count = Number(db.prepare("SELECT count(*) as count FROM government_projects").get().count || 0);
const sourceCount = Number(db.prepare("SELECT count(*) as count FROM project_sources").get().count || 0);
db.close();

if (count === 0 || sourceCount === 0) {
  throw new Error("Build verification failed: intelligence records are missing in " + ledgerPath());
}
console.log(`Verified ${count} government projects and ${sourceCount} sources in published bundle.`);
