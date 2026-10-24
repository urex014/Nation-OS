import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applySchema } from "@/lib/db/schema";
import { seed } from "@/lib/db/seed/run";

const globalForDb = globalThis as unknown as { nationDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.nationDb) {
    const filename =
      process.env.NATION_DB_PATH ?? path.join(process.cwd(), "data", "nationos.sqlite");
    if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });
    const db = new DatabaseSync(filename);
    if (filename !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    applySchema(db);
    seed(db);
    globalForDb.nationDb = db;
  }
  return globalForDb.nationDb;
}
