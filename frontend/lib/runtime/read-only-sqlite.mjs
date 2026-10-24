import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Opens a bundled SQLite file without writing a row.
 * immutable=1 needs no lock file beside the bundle. If that open fails, the
 * same bytes are copied once under /tmp and opened read-only. That copy is a
 * cache of the published file, not a place the app saves anything.
 */
export function openReadOnlySqlite(filename) {
  const absolute = path.resolve(filename);
  const uri = `file:${absolute}?mode=ro&immutable=1`;
  try {
    return lockDown(new DatabaseSync(uri, { readOnly: true }));
  } catch {
    try {
      return lockDown(new DatabaseSync(absolute, { readOnly: true }));
    } catch {
      return lockDown(new DatabaseSync(cacheCopy(absolute), { readOnly: true }));
    }
  }
}

export function readOnlyCachePath(filename) {
  const absolute = path.resolve(filename);
  const stat = statSync(absolute);
  const hash = createHash("sha256")
    .update(`${absolute}\0${stat.size}\0${stat.mtimeMs}`)
    .digest("hex")
    .slice(0, 16);
  return path.join("/tmp", "nationos-ro", `${hash}.sqlite`);
}

function lockDown(db) {
  db.exec("pragma query_only=ON; pragma foreign_keys=ON;");
  return db;
}

function cacheCopy(absolute) {
  const cache = readOnlyCachePath(absolute);
  if (!existsSync(cache)) {
    mkdirSync(path.dirname(cache), { recursive: true });
    copyFileSync(absolute, cache);
  }
  return `file:${cache}?mode=ro&immutable=1`;
}
