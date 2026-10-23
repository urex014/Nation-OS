/** Stop on the first failed invariant suite. JSX workflows are exercised separately by tsx. */
import { spawnSync } from "node:child_process";
const suites = [
  "scripts/check-lines.mjs",
  ...[
    "citizens.cjs",
    "planning.cjs",
    "economy.cjs",
    "commerce.cjs",
    "comparisons.mjs",
    "ai.mjs",
    "proposal-review.mjs",
    "series-model.mjs",
  ].map((file) => `tests/${file}`),
];
for (const file of suites) {
  const run = spawnSync(process.execPath, [file], { stdio: "inherit" });
  if (run.status !== 0) process.exit(run.status || 1);
}
