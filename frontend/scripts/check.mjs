import { spawnSync } from "node:child_process";
// Fail fast; tests use a temporary database and never modify the working registry.
for (const args of [
  ["scripts/check-lines.mjs"],
  ["--test", "tests/nigeria.mjs", "tests/chat.mjs", "tests/origin.mjs", "tests/runtime.mjs", "tests/ai.mjs", "tests/budget.mjs"],
  [
    "node_modules/tsx/dist/cli.mjs",
    "--test",
    "tests/auth.mjs",
    "tests/accounts.mjs",
    "tests/runtime-pg.mjs",
    "tests/main-contract.test.ts",
    "tests/intelligence.test.ts",
  ],
  [
    "node_modules/tsx/dist/cli.mjs",
    "--test",
    "tests/domain/allocate-bounds.test.ts",
    "tests/domain/allocate.test.ts",
    "tests/domain/api-bugs.test.ts",
    "tests/domain/chat.test.ts",
    "tests/domain/faac.test.ts",
    "tests/domain/formula.test.ts",
    "tests/domain/overview-db.test.ts",
    "tests/domain/recommend-keywords.test.ts",
    "tests/domain/recommend-sum.test.ts",
    "tests/domain/shares.test.ts",
    "tests/domain/trajectory.test.ts",
  ],
]) {
  const run = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (run.status) {
    process.exit(run.status);
  }
}
