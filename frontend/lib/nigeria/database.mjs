import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { importNigeriaData } from "./import-data.mjs";

export const sourceDirectory = () =>
  path.resolve(process.env.NATIONOS_SOURCE_DIR || "data/nigeria/normalized");
export const databasePath = () =>
  path.resolve(process.env.NATIONOS_DB_PATH || "data/nigeria/nationos.sqlite");
const instances = (globalThis[Symbol.for("nationos.sqlite")] ||= new Map());

export function getDatabase() {
  const filename = databasePath();
  if (instances.has(filename)) return instances.get(filename);
  mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  // WAL keeps reads responsive while a short save/review transaction is committed.
  db.exec("pragma journal_mode=WAL; pragma foreign_keys=ON; pragma busy_timeout=5000;");
  db.exec(readFileSync(path.resolve("lib/nigeria/schema.sql"), "utf8"));
  if (!db.prepare("select count(*) as count from sources").get().count)
    importNigeriaData(db, sourceDirectory());
  instances.set(filename, db);
  return db;
}
