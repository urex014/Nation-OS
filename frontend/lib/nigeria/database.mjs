import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { openReadOnlySqlite } from "../runtime/read-only-sqlite.mjs";
import { importNigeriaData } from "./import-data.mjs";

export const sourceDirectory = () =>
  path.resolve(process.env.NATIONOS_SOURCE_DIR || "data/nigeria/normalized");
export const databasePath = () =>
  path.resolve(process.env.NATIONOS_DB_PATH || "data/nigeria/nationos.sqlite");
const instances = (globalThis[Symbol.for("nationos.sqlite")] ||= new Map());

const MISSING =
  "Published figures are not built yet. Run npm run db:init. The sourced file is read-only at run time.";

/** App reads. This does not create a file, copy it, or write a row. */
export function getDatabase() {
  const filename = databasePath();
  if (instances.has(filename)) return instances.get(filename);
  if (!existsSync(filename)) throw Object.assign(Error(MISSING), { status: 503 });
  const db = openReadOnlySqlite(filename);
  instances.set(filename, db);
  return db;
}

/**
 * Builds the sourced file for db:init, the production build, and tests.
 * The running app does not call this.
 */
export function prepareSourcedDatabase() {
  const filename = databasePath();
  const cached = instances.get(filename);
  if (cached) {
    cached.close();
    instances.delete(filename);
  }
  mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec("pragma journal_mode=DELETE; pragma foreign_keys=ON;");
  db.exec(readFileSync(path.resolve("lib/nigeria/schema.sql"), "utf8"));
  importNigeriaData(db, sourceDirectory());
  db.close();
}
