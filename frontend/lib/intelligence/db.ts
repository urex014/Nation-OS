import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ledgerPath, getDb as getReadOnlyDb } from "../db/connection";
import { databaseUrl } from "../runtime/database-url";
import { getSql, ensureRuntimeSchema } from "../runtime/postgres";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;
  const filename = ledgerPath();
  try {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    const db = new DatabaseSync(filename);
    db.exec("PRAGMA busy_timeout = 5000");
    db.exec("PRAGMA foreign_keys = ON");
    dbInstance = db;
    return db;
  } catch {
    return getReadOnlyDb();
  }
}

export function getReadDb(): DatabaseSync {
  return getDb();
}

export function getWriteDb(): DatabaseSync {
  return getDb();
}

export function isPostgresActive(): boolean {
  return Boolean(databaseUrl());
}

export async function getActiveSql() {
  if (!isPostgresActive()) return null;
  await ensureRuntimeSchema();
  return getSql();
}
