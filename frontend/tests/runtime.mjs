import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

test("published figures open read-only and are not copied under /tmp", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "nationos-ro-"));
  const previous = process.env.NATIONOS_DB_PATH;
  const vercel = process.env.VERCEL;
  process.env.NATIONOS_DB_PATH = path.join(directory, "figures.sqlite");
  process.env.VERCEL = "1";
  try {
    const source = readFileSync(new URL("../lib/nigeria/database.mjs", import.meta.url), "utf8");
    const ledger = readFileSync(new URL("../lib/db/connection.ts", import.meta.url), "utf8");
    assert.doesNotMatch(source, /\/tmp/);
    assert.doesNotMatch(ledger, /\/tmp/);
    assert.match(source, /readOnly:\s*true/);
    assert.match(ledger, /readOnly:\s*true/);
    const { prepareSourcedDatabase, getDatabase, databasePath } = await import(
      "../lib/nigeria/database.mjs"
    );
    prepareSourcedDatabase();
    const db = getDatabase();
    assert.equal(databasePath().includes(`${path.sep}tmp${path.sep}nationos${path.sep}`), false);
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
