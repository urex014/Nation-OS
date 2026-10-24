import { databasePath, prepareSourcedDatabase } from "../lib/nigeria/database.mjs";
import { ledgerPath, prepareLedger } from "../lib/db/connection.ts";

prepareSourcedDatabase();
console.log("Published figures are ready:", databasePath());
prepareLedger();
console.log("Fiscal file is ready:", ledgerPath());
