import { ledgerPath, prepareLedger } from "../lib/db/connection";

prepareLedger();
console.log("SQLite ledger is ready at", ledgerPath());
