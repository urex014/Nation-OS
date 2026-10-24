import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

test("published figures open read-only from the bundled path", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "nationos-ro-"));
  const previous = process.env.NATIONOS_DB_PATH;
  const vercel = process.env.VERCEL;
  process.env.NATIONOS_DB_PATH = path.join(directory, "figures.sqlite");
  process.env.VERCEL = "1";
  try {
    const source = readFileSync(new URL("../lib/nigeria/database.mjs", import.meta.url), "utf8");
    const ledger = readFileSync(new URL("../lib/db/connection.ts", import.meta.url), "utf8");
    const opener = readFileSync(
      new URL("../lib/runtime/read-only-sqlite.mjs", import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(source, /\/tmp/);
    assert.doesNotMatch(ledger, /\/tmp/);
    assert.match(source, /openReadOnlySqlite/);
    assert.match(ledger, /openReadOnlySqlite/);
    assert.match(opener, /readOnly:\s*true/);
    assert.match(opener, /immutable=1/);
    assert.doesNotMatch(opener, /\b(insert into|delete from|create table)\b/i);
    const { prepareSourcedDatabase, getDatabase, databasePath } =
      await import("../lib/nigeria/database.mjs");
    const { readOnlyCachePath } = await import("../lib/runtime/read-only-sqlite.mjs");
    prepareSourcedDatabase();
    const db = getDatabase();
    assert.equal(existsSync(readOnlyCachePath(databasePath())), false);
    assert.throws(() => db.exec("create table should_fail(id integer)"));
    db.close();
    globalThis[Symbol.for("nationos.sqlite")]?.delete(databasePath());
  } finally {
    if (previous === undefined) delete process.env.NATIONOS_DB_PATH;
    else process.env.NATIONOS_DB_PATH = previous;
    if (vercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = vercel;
    rmSync(directory, { recursive: true, force: true });
  }
});
