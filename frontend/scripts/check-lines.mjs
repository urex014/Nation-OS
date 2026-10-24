import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
const ignored = new Set([
  "node_modules",
  ".next",
  ".git",
  ".npm-cache",
  ".recovery",
  ".rebuild",
  "raw",
  "normalized",
]);
const failures = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(item.name)) continue;
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (
      /\.(mjs|js|jsx|ts|tsx|css|sql|py|md|json)$/.test(file) &&
      !["package-lock.json"].includes(item.name)
    ) {
      const count = readFileSync(file, "utf8").trimEnd().split(/\r?\n/).length;
      if (count > 300) failures.push(`${file}: ${count}`);
    }
  }
}
walk(".");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("All maintained source and documentation files are at most 300 lines.");
