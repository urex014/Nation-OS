/** Enforce module size without pretending machine-generated dependencies are maintained source. */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const excluded = new Set([
  "node_modules",
  ".next",
  ".npm-cache",
  ".git",
  "coverage",
  "test-results",
]);
const machineFiles = new Set(["package-lock.json", "next-env.d.ts", "tsconfig.tsbuildinfo"]);
const extensions = /\.(?:[cm]?js|jsx|tsx?|css|json|md|sql|ya?ml|svg)$/;
const files = [];
function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name) || machineFiles.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (extensions.test(file) || entry.name.startsWith(".")) files.push(file);
  }
}
visit(".");
let longest = { lines: 0 };
for (const file of files) {
  const text = readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  const lines = text ? text.split("\n").length - Number(text.endsWith("\n")) : 0;
  if (lines > longest.lines) longest = { file, lines };
  if (lines > 300) {
    console.error(`${file}: ${lines} lines (maximum 300)`);
    process.exitCode = 1;
  }
}
if (!process.exitCode)
  console.log(
    `Line policy passed: ${files.length} maintained files; longest ${longest.file} (${longest.lines} lines).`,
  );
