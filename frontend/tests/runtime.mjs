import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(new URL("../lib/runtime/sqlite-file.mjs", import.meta.url));

test("a Vercel run opens SQLite under /tmp and does not require a bundled file", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
        import { writableDatabasePath } from ${JSON.stringify(modulePath)};
        process.env.VERCEL = "1";
        const auth = writableDatabasePath("/read-only/data/auth.sqlite");
        const fiscal = writableDatabasePath("/read-only/data/nigeria/nationos.sqlite");
        const sameName = writableDatabasePath("/read-only/other/nationos.sqlite");
        if (!auth.startsWith("/tmp/nationos/") || !auth.endsWith(".sqlite")) process.exit(1);
        if (auth === fiscal || fiscal === sameName) process.exit(2);
        if (writableDatabasePath(":memory:") !== ":memory:") process.exit(3);
        delete process.env.VERCEL;
        if (writableDatabasePath("/read-only/data/auth.sqlite") !== "/read-only/data/auth.sqlite") {
          process.exit(4);
        }
      `,
    ],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
