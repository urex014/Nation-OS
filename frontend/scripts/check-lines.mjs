import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const skip = new Set(["node_modules", ".next", "data"]);
const extensions = new Set([".ts", ".tsx", ".css", ".mjs", ".js"]);
const tooLong = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!extensions.has(extname(name))) continue;
    const text = readFileSync(path, "utf8");
    const physical = text === "" ? 0 : text.split(/\r?\n/).length - (text.endsWith("\n") ? 1 : 0);
    if (physical > 300) tooLong.push(`${physical}\t${path.slice(root.length)}`);
  }
}

walk(root);
if (tooLong.length > 0) {
  console.error(`Files over 300 lines:\n${tooLong.join("\n")}`);
  process.exit(1);
}
console.log("All source files are within 300 lines.");
