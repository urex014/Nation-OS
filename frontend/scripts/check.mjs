import { spawnSync } from "node:child_process";
// Fail fast; tests use a temporary database and never modify the working registry.
for (const args of [
  ["scripts/check-lines.mjs"],
  ["--test", "tests/nigeria.mjs", "tests/chat.mjs", "tests/origin.mjs", "tests/runtime.mjs", "tests/ai.mjs"],
  ["node_modules/tsx/dist/cli.mjs", "--test", "tests/auth.mjs", "tests/main-contract.test.ts"],
]) {
  const run = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (run.status) {
    process.exit(run.status);
  }
}
