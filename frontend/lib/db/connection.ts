import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applySchema } from "@/lib/db/schema";
import { seed } from "@/lib/db/seed/run";

const globalForDb = globalThis as unknown as { nationDb?: DatabaseSync };

const MISSING =
  "The fiscal file is missing. Run npm run db:init. That file is read-only at run time.";

export function ledgerPath(): string {
  return process.env.NATION_DB_PATH ?? path.join(process.cwd(), "data", "nationos.sqlite");
}

/** Writes the bundled fiscal file. Scripts and tests call this. Request handlers do not. */
export function prepareLedger(): void {
  if (globalForDb.nationDb) {
    globalForDb.nationDb.close();
    globalForDb.nationDb = undefined;
  }
  const filename = ledgerPath();
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA journal_mode = DELETE");
  db.exec("PRAGMA foreign_keys = ON");
  applySchema(db);
  seed(db);
  db.close();
}

export function getDb(): DatabaseSync {
  if (!globalForDb.nationDb) {
    const filename = ledgerPath();
    if (!fs.existsSync(filename)) throw Object.assign(new Error(MISSING), { status: 503 });
    const db = new DatabaseSync(filename, { readOnly: true });
    db.exec("PRAGMA query_only = ON");
    db.exec("PRAGMA foreign_keys = ON");
    globalForDb.nationDb = db;
  }
  return globalForDb.nationDb;
}
